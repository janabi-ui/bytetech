<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Repositories\SellerRepository;
use App\Repositories\ProductRepository;
use App\Repositories\CommissionRepository;
use App\Services\MpesaB2cService;
use Throwable;

/**
 * Enterprise Seller Portal Controller
 * Supplies dashboard metrics, inventory management, and earnings reporting.
 */
class SellerController
{
    private SellerRepository $sellerRepo;
    private ProductRepository $productRepo;
    private CommissionRepository $commRepo;
    private MpesaB2cService $b2cService;

    public function __construct()
    {
        $this->sellerRepo  = new SellerRepository();
        $this->productRepo = new ProductRepository();
        $this->commRepo    = new CommissionRepository();
        $this->b2cService  = new MpesaB2cService();
    }

    public function dashboard(Request $request): void
    {
        try {
            $sellerId = $request->getAttribute('seller_id');
            if (!$sellerId) {
                Response::unauthorized('Session invalid');
                return;
            }

            $seller = $this->sellerRepo->findById($sellerId);
            $totals = $this->sellerRepo->getSellerStats($sellerId);
            $products = $this->productRepo->getBySeller($sellerId);
            $orderRepo = new \App\Repositories\OrderRepository();
            $orders = $orderRepo->getSellerOrders($sellerId);

            Response::success([
                'seller'   => $seller,
                'totals'   => $totals,
                'products' => $products,
                'orders'   => $orders,
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function updateStock(Request $request): void
    {
        try {
            $sellerId = $request->getAttribute('seller_id');
            $data = $request->body();
            $productId = (string)($data['product_id'] ?? '');
            $stock = (int)($data['stock'] ?? 0);

            if (empty($productId)) {
                Response::error('Product ID is required.', 400);
                return;
            }

            // Verify seller owns the product
            $prod = $this->productRepo->getById($productId);
            if (!$prod || $prod['seller_id'] !== $sellerId) {
                Response::forbidden('Not authorized to modify this product.');
                return;
            }

            $sql = 'UPDATE products SET stock = ? WHERE id = ? AND seller_id = ?';
            \App\Core\Database::execute($sql, [$stock, $productId, $sellerId]);

            Response::success([
                'product_id' => $productId,
                'stock'      => $stock,
            ], 'Stock quantity updated successfully');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function getProducts(Request $request): void
    {
        try {
            $sellerId = $request->getAttribute('seller_id');
            $products = $this->productRepo->getBySeller($sellerId);

            Response::success(['products' => $products]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function addProduct(Request $request): void
    {
        try {
            $sellerId = $request->getAttribute('seller_id');
            $data = $request->body();

            $data['seller_id'] = $sellerId;

            // Determine commission rate for this item based on its category
            $category = $data['category'] ?? 'Accessories';
            $data['commission_rate'] = $this->commRepo->getRateByCategory($category);

            $productId = $this->productRepo->create($data);

            Response::success([
                'id'         => $productId,
                'product'    => $this->productRepo->getById($productId),
            ], 'Product published successfully', 201);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function deleteProduct(Request $request): void
    {
        try {
            $sellerId = $request->getAttribute('seller_id');
            $id = (string)($request->query('id') ?? $request->input('id'));

            if (empty($id)) {
                Response::error('Product ID is required for deletion.', 400);
                return;
            }

            $deleted = $this->productRepo->delete($id, $sellerId);

            if (!$deleted) {
                Response::error('Product not found or not owned by your merchant account.', 404);
                return;
            }

            Response::success(['id' => $id], 'Product removed successfully');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function requestPayout(Request $request): void
    {
        try {
            $sellerId = $request->getAttribute('seller_id');
            if (!$sellerId) {
                Response::unauthorized('Session invalid');
                return;
            }

            $seller = $this->sellerRepo->findById($sellerId);
            if (!$seller) {
                Response::error('Merchant profile not found.', 404);
                return;
            }

            $stats       = $this->sellerRepo->getSellerStats($sellerId);
            $netEarnings = (float)($stats['net_earnings'] ?? 0);

            if ($netEarnings < 10) {
                Response::error('Minimum payout is KES 10. No disbursable balance available.', 400);
                return;
            }

            $phone     = $seller['phone'] ?? '';
            if (empty($phone)) {
                Response::error('No M-Pesa phone number on file. Please update your profile.', 400);
                return;
            }

            $payoutRef = 'B2C-' . strtoupper(bin2hex(random_bytes(4))) . '-' . date('Ymd');
            $remarks   = 'Payout: ' . substr((string)($seller['store_name'] ?? 'Seller'), 0, 60);

            // 1. Persist a pending payout record before hitting Daraja
            try {
                \App\Core\Database::execute(
                    'INSERT IGNORE INTO seller_payouts
                     (id, seller_id, amount, phone, status, conversation_id, originator_conversation_id, payout_ref, created_at)
                     VALUES (?, ?, ?, ?, "pending", "", "", ?, NOW())',
                    [\App\Core\Security\Sanitizer::uuid(), $sellerId, $netEarnings, $phone, $payoutRef]
                );
            } catch (Throwable $dbEx) {
                \App\Core\Logger::warning('Could not insert seller_payouts row: ' . $dbEx->getMessage());
            }

            // 2. Dispatch real Daraja B2C request
            $result = $this->b2cService->initiateB2cPayout(
                $phone,
                $netEarnings,
                $payoutRef,
                $remarks
            );

            if (!empty($result['success'])) {
                // 3. Update the payout row with Daraja conversation IDs
                try {
                    \App\Core\Database::execute(
                        'UPDATE seller_payouts
                         SET conversation_id = ?, originator_conversation_id = ?, status = "processing"
                         WHERE payout_ref = ?',
                        [
                            $result['ConversationID'] ?? '',
                            $result['OriginatorConversationID'] ?? '',
                            $payoutRef
                        ]
                    );
                } catch (Throwable $upEx) {
                    \App\Core\Logger::warning('Could not update seller_payouts conversation IDs: ' . $upEx->getMessage());
                }

                Response::success([
                    'payout_ref'      => $payoutRef,
                    'conversation_id' => $result['ConversationID'] ?? null,
                    'amount'          => $netEarnings,
                    'recipient'       => $phone,
                    'is_simulated'    => $result['is_simulated'] ?? false,
                    'status'          => 'PROCESSING',
                    'message'         => $result['ResponseDescription'] ?? 'Payout dispatched to Safaricom Daraja.',
                ], 'M-Pesa B2C payout dispatched successfully');
            } else {
                // Mark payout record as failed
                try {
                    \App\Core\Database::execute(
                        'UPDATE seller_payouts SET status = "failed" WHERE payout_ref = ?',
                        [$payoutRef]
                    );
                } catch (Throwable) {}

                Response::error(
                    $result['error'] ?? 'Failed to dispatch M-Pesa B2C payout.',
                    502,
                    $result
                );
            }
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
