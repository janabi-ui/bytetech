<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\MpesaService;
use App\Repositories\OrderRepository;
use Throwable;

/**
 * Enterprise Safaricom M-Pesa Daraja Payment Controller
 * Handles Lipa Na M-Pesa STK Push prompts, status queries, and Safaricom webhook callbacks.
 */
class PaymentController
{
    private MpesaService $mpesaService;
    private OrderRepository $orderRepo;

    public function __construct()
    {
        $this->mpesaService = new MpesaService();
        $this->orderRepo = new OrderRepository();
    }

    /**
     * Dispatches Lipa Na M-Pesa Online STK Push prompt to customer's mobile handset
     */
    public function stkPush(Request $request): void
    {
        try {
            $data = $request->body();
            $phone = (string)($data['phone'] ?? $data['customer']['phone'] ?? '');
            $amount = (float)($data['amount'] ?? $data['total_amount'] ?? 0);
            $orderId = (string)($data['order_id'] ?? $data['id'] ?? ('BT01-' . date('ymd') . '-' . strtoupper(substr(uniqid(), -4))));

            if (empty($phone)) {
                Response::error('Kenyan M-Pesa phone number is required (e.g. 0712 345 678).', 400);
                return;
            }

            if ($amount <= 0) {
                Response::error('Order total amount must be greater than zero.', 400);
                return;
            }

            $result = $this->mpesaService->initiateStkPush($phone, $amount, $orderId);

            if (!empty($result['success'])) {
                Response::success($result, 'M-Pesa STK Push prompt dispatched');
            } else {
                Response::error($result['error'] ?? 'Failed to initiate M-Pesa STK Push.', 400, $result);
            }
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Polls the status of an ongoing M-Pesa STK Push transaction
     */
    public function queryStatus(Request $request): void
    {
        try {
            $data = $request->body();
            $checkoutRequestId = (string)($data['checkout_request_id'] ?? $request->query('checkout_request_id'));
            $orderId = (string)($data['order_id'] ?? $request->query('order_id'));

            if (empty($checkoutRequestId) && empty($orderId)) {
                Response::error('checkout_request_id or order_id is required.', 400);
                return;
            }

            $result = $this->mpesaService->queryStkStatus($checkoutRequestId, $orderId);
            Response::success($result, 'M-Pesa status query result');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * Safaricom Daraja Webhook Callback Receiver
     */
    public function callback(Request $request): void
    {
        try {
            $payload = $request->body();
            $this->mpesaService->handleCallback($payload);

            // Safaricom Daraja expects standard JSON acknowledgement
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
            exit;
        } catch (Throwable $e) {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ResultCode' => 1, 'ResultDesc' => $e->getMessage()]);
            exit;
        }
    }

    /**
     * Universal Order Verification Endpoint
     */
    public function verify(Request $request): void
    {
        try {
            $data = $request->body();
            $orderId = (string)($data['order_id'] ?? $data['invoice_id'] ?? $request->query('order_id'));

            if (empty($orderId)) {
                Response::error('Order identifier is required for payment verification.', 400);
                return;
            }

            $order = $this->orderRepo->findByIdOrCustomer($orderId);
            if (!$order) {
                Response::error('Order not found.', 404);
                return;
            }

            Response::success([
                'status'         => strtoupper($order['status']),
                'order_id'       => $order['id'],
                'receipt'        => $order['flw_transaction_id'] ?? null,
                'total_amount'   => (float)$order['total_amount'],
                'payment_method' => $order['payment_method'] ?? 'M-Pesa',
            ], 'Order verification completed');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
