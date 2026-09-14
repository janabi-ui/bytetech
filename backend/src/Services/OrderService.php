<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\OrderRepository;
use App\Repositories\ProductRepository;
use App\Repositories\SellerRepository;
use App\Core\Database;
use App\Core\Security\Sanitizer;
use Exception;

/**
 * Enterprise Order Orchestration Service
 * Executes atomic transactional orders, computes vendor commissions, updates inventory,
 * and builds customer receipts.
 */
class OrderService
{
    private OrderRepository $orderRepo;
    private ProductRepository $productRepo;
    private SellerRepository $sellerRepo;
    private CommissionService $commService;

    public function __construct()
    {
        $this->orderRepo = new OrderRepository();
        $this->productRepo = new ProductRepository();
        $this->sellerRepo = new SellerRepository();
        $this->commService = new CommissionService();
    }

    public function createOrder(array $payload): array
    {
        $customer = $payload['customer'] ?? [];
        $cartItems = $payload['cartItems'] ?? ($payload['items'] ?? []);

        if (empty($cartItems) || !is_array($cartItems)) {
            throw new Exception('Cart is empty. Please add items before checking out.');
        }

        $customerPhone = $customer['phone'] ?? null;
        $orderId = $payload['tx_ref'] ?? ($payload['order_id'] ?? Sanitizer::generateOrderId('BT01', $customerPhone));
        $transactionId = $payload['transaction_id'] ?? ($payload['invoice_id'] ?? ('TXN-' . bin2hex(random_bytes(6))));
        $paymentMethod = $payload['payment_method'] ?? 'M-Pesa';

        return Database::transaction(function () use ($orderId, $transactionId, $paymentMethod, $customer, $cartItems) {
            $computedTotal = 0.0;
            $preparedItems = [];

            foreach ($cartItems as $item) {
                $productId = (string)($item['id'] ?? $item['product_id'] ?? '');
                $productName = $item['name'] ?? $item['product_name'] ?? 'Electronics Item';
                $quantity = max(1, (int)($item['quantity'] ?? $item['qty'] ?? 1));
                $unitPrice = (float)($item['price'] ?? $item['unit_price'] ?? 0.0);
                $category = $item['category'] ?? 'Accessories';
                $sellerId = $item['seller_id'] ?? null;
                $sellerName = $item['seller_name'] ?? 'Byte Tech Partner';
                $image = $item['image'] ?? $item['image_url'] ?? $item['product_image'] ?? null;

                // Lookup live product details if in database
                if ($productId) {
                    $dbProd = $this->productRepo->getById($productId);
                    if ($dbProd) {
                        $productName = $dbProd['name'] ?? $productName;
                        $category = $dbProd['category'] ?? $category;
                        $sellerId = $dbProd['seller_id'] ?? $sellerId;
                        if (!empty($dbProd['store_name'])) {
                            $sellerName = $dbProd['store_name'];
                        }
                        if (!empty($dbProd['image_url'])) {
                            $image = $dbProd['image_url'];
                        }

                        // Check stock availability
                        $availableStock = (int)($dbProd['stock'] ?? 0);
                        if ($availableStock < $quantity) {
                            throw new Exception("Insufficient stock for '{$productName}'. Only {$availableStock} available in inventory.");
                        }

                        // SECURITY: Authoritative price enforcement from database
                        $unitPrice = (float)$dbProd['price'];
                    }
                }

                if ($unitPrice <= 0.0) {
                    throw new Exception("Invalid item price for product '{$productName}'.");
                }

                $financials = $this->commService->calculateItemFinancials($category, $unitPrice, $quantity);
                $computedTotal += $financials['total_price'];

                $preparedItems[] = [
                    'order_id'        => $orderId,
                    'product_id'      => $productId ?: null,
                    'seller_id'       => $sellerId ?: null,
                    'product_name'    => $productName,
                    'product_image'   => $image,
                    'seller_name'     => $sellerName,
                    'quantity'        => $quantity,
                    'unit_price'      => $financials['unit_price'],
                    'total_price'     => $financials['total_price'],
                    'commission_rate' => $financials['commission_rate'],
                    'platform_fee'    => $financials['platform_fee'],
                    'seller_earning'  => $financials['seller_earning'],
                ];
            }

            // 1. Create order record
            $this->orderRepo->createOrder([
                'id'                 => $orderId,
                'customer_name'      => $customer['name'] ?? 'Valued Customer',
                'customer_email'     => $customer['email'] ?? null,
                'customer_phone'     => $customer['phone'] ?? null,
                'shipping_address'   => $customer['address'] ?? ($customer['shipping_address'] ?? 'Nairobi / Mombasa Hub'),
                'total_amount'       => $computedTotal,
                'currency'           => 'KES',
                'payment_method'     => $paymentMethod,
                'flw_transaction_id' => $transactionId,
                'flw_tx_ref'         => $orderId,
                'status'             => 'paid',
            ]);

            // 2. Insert line items & decrement stock
            foreach ($preparedItems as $lineItem) {
                $this->orderRepo->createOrderItem($lineItem);
                if (!empty($lineItem['product_id'])) {
                    $this->productRepo->decrementStock($lineItem['product_id'], $lineItem['quantity']);
                }
            }

            // 3. Return full order object with tax breakdown
            $vatInfo = $this->commService->computeVatBreakdown($computedTotal);
            $fullOrder = $this->orderRepo->findWithItems($orderId);
            $fullOrder['vat_breakdown'] = $vatInfo;

            return $fullOrder;
        });
    }

    public function getOrder(string $orderId): ?array
    {
        $order = $this->orderRepo->findWithItems($orderId);
        if (!$order) {
            return null;
        }

        $total = (float)($order['total_amount'] ?? 0.0);
        $order['vat_breakdown'] = $this->commService->computeVatBreakdown($total);

        return $order;
    }
}
