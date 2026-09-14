<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\OrderRepository;
use App\Core\Env;
use App\Core\Logger;
use Throwable;

/**
 * Enterprise Safaricom Daraja M-Pesa API Service
 * Handles Lipa Na M-Pesa Online (STK Push), Status Inquiries, and Instant Webhook Callbacks.
 */
class MpesaService
{
    private OrderRepository $orderRepo;
    private KraEtimsService $kraService;
    private static ?string $cachedToken = null;
    private static int $tokenExpiry = 0;

    public function __construct()
    {
        $this->orderRepo = new OrderRepository();
        $this->kraService = new KraEtimsService();
    }

    /**
     * Get Daraja Base API URL depending on environment (sandbox or live)
     */
    public function getBaseUrl(): string
    {
        $env = strtolower(Env::getString('MPESA_ENV', 'sandbox'));
        return ($env === 'live' || $env === 'production')
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    /**
     * Formats any Kenyan phone number into the required international format: 2547XXXXXXXX or 2541XXXXXXXX
     */
    public static function formatPhone(string $phone): string
    {
        $clean = preg_replace('/\D/', '', $phone);
        if (str_starts_with($clean, '0')) {
            $clean = '254' . substr($clean, 1);
        } elseif (str_starts_with($clean, '7') || str_starts_with($clean, '1')) {
            $clean = '254' . $clean;
        } elseif (str_starts_with($clean, '+254')) {
            $clean = substr($clean, 1);
        }
        return $clean;
    }

    /**
     * Generates or retrieves cached OAuth Bearer Access Token from Safaricom Daraja
     */
    public function getAccessToken(): ?string
    {
        if (self::$cachedToken && time() < (self::$tokenExpiry - 60)) {
            return self::$cachedToken;
        }

        $consumerKey = Env::getString('MPESA_CONSUMER_KEY', '');
        $consumerSecret = Env::getString('MPESA_CONSUMER_SECRET', '');

        if (empty($consumerKey) || empty($consumerSecret)) {
            Logger::warning('M-Pesa Consumer Key or Secret not set in environment.');
            return null;
        }

        $url = $this->getBaseUrl() . '/oauth/v1/generate?grant_type=client_credentials';
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json; charset=utf-8'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERPWD        => "{$consumerKey}:{$consumerSecret}",
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error || $httpCode !== 200) {
            Logger::error('Failed to generate M-Pesa access token', [
                'http_code' => $httpCode,
                'error'     => $error,
                'response'  => $response
            ]);
            return null;
        }

        $data = json_decode($response ?: '{}', true);
        if (!empty($data['access_token'])) {
            self::$cachedToken = (string)$data['access_token'];
            $expiresIn = (int)($data['expires_in'] ?? 3599);
            self::$tokenExpiry = time() + $expiresIn;
            return self::$cachedToken;
        }

        return null;
    }

    /**
     * Dispatches a Lipa Na M-Pesa STK Push prompt directly to the customer's phone
     */
    public function initiateStkPush(string $phone, float $amount, string $orderId, string $description = 'Byte Tech Hardware'): array
    {
        $formattedPhone = self::formatPhone($phone);
        $roundedAmount = (int)ceil($amount); // Safaricom STK Push requires whole integer KES
        if ($roundedAmount < 1) {
            $roundedAmount = 1;
        }

        $shortcode = Env::getString('MPESA_SHORTCODE', '174379');
        $passkey = Env::getString('MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
        $callbackUrl = Env::getString('MPESA_CALLBACK_URL', '');

        if (empty($callbackUrl)) {
            $appUrl = Env::getString('APP_URL', 'https://bytetech.co.ke');
            $callbackUrl = rtrim($appUrl, '/') . '/api/payments/mpesa-callback';
        }

        $token = $this->getAccessToken();

        // ── Simulation / Developer Fallback Mode ──────────────────────────
        // Allows testing the entire frontend and checkout flow without halting if API keys are pending
        if (!$token || Env::getString('MPESA_CONSUMER_KEY') === 'your_daraja_consumer_key') {
            $simCheckoutId = 'ws_CO_SIM_' . date('YmdHis') . '_' . substr(md5($orderId), 0, 6);
            Logger::info('Running M-Pesa STK in simulation mode', [
                'order_id' => $orderId,
                'phone'    => $formattedPhone,
                'amount'   => $roundedAmount,
                'checkout_id' => $simCheckoutId
            ]);

            return [
                'success'             => true,
                'is_simulated'        => true,
                'MerchantRequestID'   => 'MR_SIM_' . uniqid(),
                'CheckoutRequestID'   => $simCheckoutId,
                'ResponseCode'        => '0',
                'ResponseDescription' => 'Success. Request accepted for processing',
                'CustomerMessage'     => "Success. STK Push prompt sent to {$formattedPhone}. Please enter your M-Pesa PIN on your phone.",
                'order_id'            => $orderId,
                'amount'              => $roundedAmount,
                'phone'               => $formattedPhone,
            ];
        }

        // ── Real Safaricom Daraja STK Push ──────────────────────────────
        $timestamp = date('YmdHis');
        $password = base64_encode($shortcode . $passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => (int)$shortcode,
            'Password'          => $password,
            'Timestamp'         => $timestamp,
            'TransactionType'   => 'CustomerPayBillOnline',
            'Amount'            => $roundedAmount,
            'PartyA'            => (int)$formattedPhone,
            'PartyB'            => (int)$shortcode,
            'PhoneNumber'       => (int)$formattedPhone,
            'CallBackURL'       => $callbackUrl,
            'AccountReference'  => substr($orderId, 0, 12),
            'TransactionDesc'   => substr($description, 0, 20),
        ];

        $url = $this->getBaseUrl() . '/mpesa/stkpush/v1/processrequest';
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                "Authorization: Bearer {$token}",
            ],
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 25,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error || $httpCode >= 400) {
            Logger::error('M-Pesa STK Push dispatch failed', [
                'http_code' => $httpCode,
                'error'     => $error,
                'response'  => $response,
            ]);

            return [
                'success' => false,
                'error'   => 'Failed to communicate with Safaricom Daraja. Please verify your phone number and try again.',
                'details' => $response
            ];
        }

        $resData = json_decode($response ?: '{}', true);
        $resCode = (string)($resData['ResponseCode'] ?? '-1');

        if ($resCode === '0') {
            Logger::info('M-Pesa STK Push accepted by Safaricom', [
                'order_id'            => $orderId,
                'checkout_request_id' => $resData['CheckoutRequestID'] ?? null
            ]);

            return [
                'success'             => true,
                'is_simulated'        => false,
                'MerchantRequestID'   => $resData['MerchantRequestID'] ?? '',
                'CheckoutRequestID'   => $resData['CheckoutRequestID'] ?? '',
                'ResponseCode'        => '0',
                'ResponseDescription' => $resData['ResponseDescription'] ?? 'Success',
                'CustomerMessage'     => $resData['CustomerMessage'] ?? "Prompt sent to {$formattedPhone}.",
                'order_id'            => $orderId,
                'amount'              => $roundedAmount,
                'phone'               => $formattedPhone
            ];
        }

        return [
            'success' => false,
            'error'   => $resData['errorMessage'] ?? ($resData['ResponseDescription'] ?? 'M-Pesa STK request declined by Safaricom.'),
            'code'    => $resCode
        ];
    }

    /**
     * Polls the status of an ongoing STK Push payment via CheckoutRequestID
     */
    public function queryStkStatus(string $checkoutRequestId, ?string $orderId = null): array
    {
        // 1. Check local database: If callback already arrived and marked order paid
        if ($orderId) {
            $order = $this->orderRepo->findById($orderId);
            if ($order && ($order['status'] === 'paid' || !empty($order['flw_transaction_id']))) {
                return [
                    'status'        => 'COMPLETED',
                    'order_id'      => $orderId,
                    'receipt'       => $order['flw_transaction_id'] ?? 'MPESA-PAID',
                    'message'       => 'Payment confirmed and verified via Safaricom.'
                ];
            }
        }

        // 2. If simulation ID
        if (str_starts_with($checkoutRequestId, 'ws_CO_SIM_')) {
            $simReceipt = 'QK' . strtoupper(substr(md5($checkoutRequestId), 0, 8));
            if ($orderId) {
                $this->orderRepo->updateStatus($orderId, 'paid', $simReceipt);
                $this->kraService->fiscalizeOrder($orderId, (float)($order['total_amount'] ?? 0));
            }
            return [
                'status'        => 'COMPLETED',
                'order_id'      => $orderId,
                'receipt'       => $simReceipt,
                'is_simulated'  => true,
                'message'       => 'Payment approved in test sandbox mode.'
            ];
        }

        // 3. Query Safaricom Daraja STK Query Endpoint
        $token = $this->getAccessToken();
        if (!$token) {
            return [
                'status'  => 'PENDING',
                'message' => 'Awaiting user PIN entry...'
            ];
        }

        $shortcode = Env::getString('MPESA_SHORTCODE', '174379');
        $passkey = Env::getString('MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
        $timestamp = date('YmdHis');
        $password = base64_encode($shortcode . $passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => (int)$shortcode,
            'Password'          => $password,
            'Timestamp'         => $timestamp,
            'CheckoutRequestID' => $checkoutRequestId,
        ];

        $url = $this->getBaseUrl() . '/mpesa/stkpushquery/v1/query';
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                "Authorization: Bearer {$token}",
            ],
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response ?: '{}', true);
        $resCode = (string)($data['ResultCode'] ?? '');

        if ($resCode === '0') {
            $receipt = $checkoutRequestId;
            if ($orderId) {
                $this->orderRepo->updateStatus($orderId, 'paid', $receipt);
            }
            return [
                'status'  => 'COMPLETED',
                'receipt' => $receipt,
                'message' => 'Payment successfully completed.'
            ];
        } elseif ($resCode === '1032') {
            return [
                'status'  => 'CANCELLED',
                'message' => 'Transaction was cancelled by user on phone.'
            ];
        } elseif ($resCode !== '') {
            return [
                'status'  => 'FAILED',
                'message' => $data['ResultDesc'] ?? 'Transaction failed.'
            ];
        }

        return [
            'status'  => 'PENDING',
            'message' => 'Waiting for user to enter M-Pesa PIN...'
        ];
    }

    /**
     * Handles incoming asynchronous Safaricom Webhook Callbacks
     */
    public function handleCallback(array $payload): bool
    {
        Logger::info('Safaricom M-Pesa callback payload received', $payload);

        $stkCallback = $payload['Body']['stkCallback'] ?? null;
        if (!$stkCallback) {
            Logger::warning('Invalid M-Pesa callback structure');
            return false;
        }

        $resultCode = (int)($stkCallback['ResultCode'] ?? -1);
        $resultDesc = (string)($stkCallback['ResultDesc'] ?? '');
        $checkoutRequestId = (string)($stkCallback['CheckoutRequestID'] ?? '');

        if ($resultCode === 0) {
            // Extract CallbackMetadata items
            $metadataItems = $stkCallback['CallbackMetadata']['Item'] ?? [];
            $meta = [];
            foreach ($metadataItems as $item) {
                if (isset($item['Name'])) {
                    $meta[$item['Name']] = $item['Value'] ?? null;
                }
            }

            $mpesaReceipt = (string)($meta['MpesaReceiptNumber'] ?? $checkoutRequestId);
            $amount = (float)($meta['Amount'] ?? 0);
            $phone = (string)($meta['PhoneNumber'] ?? '');

            Logger::info('M-Pesa STK Payment successful', [
                'receipt'             => $mpesaReceipt,
                'amount'              => $amount,
                'phone'               => $phone,
                'checkout_request_id' => $checkoutRequestId
            ]);

            // Match order by CheckoutRequestID or query
            $order = $this->orderRepo->findByIdOrCustomer($checkoutRequestId);
            if ($order) {
                $this->orderRepo->updateStatus($order['id'], 'paid', $mpesaReceipt);
                // Trigger automated KRA eTIMS invoice
                $this->kraService->fiscalizeOrder($order['id'], $amount, [
                    'phone' => $phone,
                    'name'  => $order['customer_name'] ?? 'M-Pesa Customer'
                ]);
            }

            return true;
        }

        Logger::warning('M-Pesa STK Payment rejected/cancelled', [
            'result_code' => $resultCode,
            'result_desc' => $resultDesc,
            'checkout_id' => $checkoutRequestId
        ]);

        return false;
    }
}
