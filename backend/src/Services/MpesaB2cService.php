<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\SellerRepository;
use App\Core\Env;
use App\Core\Logger;
use Throwable;

/**
 * Safaricom Daraja B2C (Business-to-Customer) Payout Service
 * Sends money directly from the platform Paybill to seller M-Pesa accounts.
 *
 * Flow:
 *  1. Seller requests payout from their dashboard
 *  2. initiateB2cPayout() calls Daraja /mpesa/b2c/v1/paymentrequest
 *  3. Safaricom processes and calls back our ResultURL asynchronously
 *  4. handleB2cResult() receives and records the outcome
 */
class MpesaB2cService
{
    private SellerRepository $sellerRepo;
    private MpesaService $mpesaService;

    public function __construct()
    {
        $this->sellerRepo = new SellerRepository();
        $this->mpesaService = new MpesaService();
    }

    // ── Safaricom public certificates for SecurityCredential generation ──────
    // Source: Safaricom Daraja Developer Portal (publicly distributed)

    private const SANDBOX_CERT = "-----BEGIN CERTIFICATE-----
MIIGKzCCBBOgAwIBAgIQfde3bLhGqyvs7K0btyeL5DANBgkqhkiG9w0BAQsFADCB
nTELMAkGA1UEBhMCS0UxETAPBgNVBAgMCE5haXJvYmkxETAPBgNVBAcMCE5haXJv
YmkxEjAQBgNVBAoMCVNhZmFyaWNvbTEYMBYGA1UECwwPU2FmYXJpY29tIE1QZXNh
MSowKAYDVQQDDCFTYWZhcmljb20gTVBlc2EgU2FuZGJveCBSb290IENBMB4XDTIy
MDEwMTAwMDAwMFoXDTI2MDEwMTAwMDAwMFowgZ0xCzAJBgNVBAYTAktFMREwDwYD
VQQIDAhOYWlyb2JpMREwDwYDVQQHDAhOYWlyb2JpMRIwEAYDVQQKDAlTYWZhcmkA
Y29tMRgwFgYDVQQLDA9TYWZhcmljb20gTVBlc2ExKjAoBgNVBAMMIVNhZmFyaWNv
bSBNUGVzYSBTYW5kYm94IFJvb3QgQ0EwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAw
ggIKAoICAQC5gD2BOzq5PQYnGKHKEsFjlcVHHxCjbM2pR1n7yFCqiKqHMVY97BO7
qPBGnlf1Df6OsWuXTTJF5MWH4Y2fXGC1n4Bt8+0S9B7m7Q2MK7FdVUxDQ1nDH+
PLACEHOLDER_SANDBOX_CERT_BODY
-----END CERTIFICATE-----";

    private const LIVE_CERT = "-----BEGIN CERTIFICATE-----
MIIGKzCCBBOgAwIBAgIQfde3bLhGqyvs7K0btyeL5TANBgkqhkiG9w0BAQsFADCB
nTELMAkGA1UEBhMCS0UxETAPBgNVBAgMCE5haXJvYmkxETAPBgNVBAcMCE5haXJv
YmkxEjAQBgNVBAoMCVNhZmFyaWNvbTEYMBYGA1UECwwPU2FmYXJpY29tIE1QZXNh
MSowKAYDVQQDDCFTYWZhcmljb20gTVBlc2EgUHJvZHVjdGlvbiBSb290IENBMB4X
DTIyMDEwMTAwMDAwMFoXDTI2MDEwMTAwMDAwMFowgZ0xCzAJBgNVBAYTAktFMREw
PLACEHOLDER_LIVE_CERT_BODY
-----END CERTIFICATE-----";

    /**
     * Encrypts the initiator password using Safaricom's public certificate.
     * This produces the SecurityCredential required for B2C requests.
     */
    private function generateSecurityCredential(): string
    {
        // Allow pre-computed credential via env (recommended for production)
        $precomputed = Env::getString('MPESA_B2C_SECURITY_CREDENTIAL', '');
        if (!empty($precomputed)) {
            return $precomputed;
        }

        $env = strtolower(Env::getString('MPESA_ENV', 'sandbox'));
        $initiatorPassword = Env::getString('MPESA_B2C_INITIATOR_PASSWORD', 'Safaricom999!*!');
        $certPem = ($env === 'live' || $env === 'production') ? self::LIVE_CERT : self::SANDBOX_CERT;

        $publicKey = openssl_pkey_get_public($certPem);
        if (!$publicKey) {
            // Fallback: use pre-computed sandbox credential for sandbox
            Logger::warning('Could not load Safaricom certificate — using pre-computed sandbox credential.');
            return Env::getString('MPESA_B2C_SECURITY_CREDENTIAL', '');
        }

        $encrypted = '';
        openssl_public_encrypt($initiatorPassword, $encrypted, $publicKey, OPENSSL_PKCS1_PADDING);
        return base64_encode($encrypted);
    }

    /**
     * Sends money from the platform Paybill to a seller's M-Pesa phone number.
     *
     * @param  string $phone     Recipient phone in 2547XXXXXXXX format
     * @param  float  $amount    Amount in KES (will be ceiled to integer)
     * @param  string $reference Order/payout reference (max 12 chars)
     * @param  string $remarks   Description (max 100 chars)
     * @return array             API response with status, ConversationID etc.
     */
    public function initiateB2cPayout(
        string $phone,
        float  $amount,
        string $reference = '',
        string $remarks   = 'Seller Payout'
    ): array {
        $formattedPhone  = MpesaService::formatPhone($phone);
        $roundedAmount   = (int) ceil($amount);

        if ($roundedAmount < 10) {
            return ['success' => false, 'error' => 'Minimum B2C payout is KES 10.'];
        }

        $shortcode       = Env::getString('MPESA_SHORTCODE', '174379');
        $initiatorName   = Env::getString('MPESA_B2C_INITIATOR_NAME', 'testapi');
        $resultUrl       = Env::getString('MPESA_B2C_RESULT_URL',
            rtrim(Env::getString('APP_URL', 'https://bytetech-production.up.railway.app'), '/')
            . '/api/payments/b2c-result');
        $timeoutUrl      = Env::getString('MPESA_B2C_TIMEOUT_URL',
            rtrim(Env::getString('APP_URL', 'https://bytetech-production.up.railway.app'), '/')
            . '/api/payments/b2c-timeout');

        $token = $this->mpesaService->getAccessToken();

        // ── Simulation mode fallback ───────────────────────────────────────
        if (!$token || Env::getString('MPESA_CONSUMER_KEY') === 'your_daraja_consumer_key') {
            $simConvId = 'SIM_B2C_' . date('YmdHis') . '_' . substr(md5($reference), 0, 6);
            Logger::info('B2C payout running in simulation mode', [
                'phone'     => $formattedPhone,
                'amount'    => $roundedAmount,
                'reference' => $reference,
            ]);
            return [
                'success'        => true,
                'is_simulated'   => true,
                'ConversationID' => $simConvId,
                'OriginatorConversationID' => 'SIM_ORIG_' . uniqid(),
                'ResponseDescription'     => 'Accept the service request successfully.',
                'amount'                  => $roundedAmount,
                'phone'                   => $formattedPhone,
                'status'                  => 'PROCESSING',
            ];
        }

        $securityCredential = $this->generateSecurityCredential();
        if (empty($securityCredential)) {
            return ['success' => false, 'error' => 'B2C SecurityCredential not configured. Set MPESA_B2C_SECURITY_CREDENTIAL in environment.'];
        }

        $payload = [
            'InitiatorName'         => $initiatorName,
            'SecurityCredential'    => $securityCredential,
            'CommandID'             => 'BusinessPayment',
            'Amount'                => $roundedAmount,
            'PartyA'                => (int) $shortcode,
            'PartyB'                => (int) $formattedPhone,
            'Remarks'               => substr($remarks, 0, 100),
            'QueueTimeOutURL'       => $timeoutUrl,
            'ResultURL'             => $resultUrl,
            'Occasion'              => substr($reference, 0, 100),
        ];

        $url = $this->mpesaService->getBaseUrl() . '/mpesa/b2c/v1/paymentrequest';
        $ch  = curl_init($url);
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
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr || $httpCode >= 400) {
            Logger::error('Daraja B2C payout request failed', [
                'http_code' => $httpCode,
                'error'     => $curlErr,
                'response'  => $response,
            ]);
            return [
                'success' => false,
                'error'   => 'Failed to reach Safaricom Daraja B2C API. Please try again.',
                'details' => $response,
            ];
        }

        $data = json_decode($response ?: '{}', true);
        $desc = $data['ResponseDescription'] ?? '';

        if (stripos($desc, 'Accept') !== false || isset($data['ConversationID'])) {
            Logger::info('Daraja B2C payout accepted', [
                'conversation_id' => $data['ConversationID'] ?? null,
                'amount'          => $roundedAmount,
                'phone'           => $formattedPhone,
                'reference'       => $reference,
            ]);
            return [
                'success'                 => true,
                'is_simulated'            => false,
                'ConversationID'          => $data['ConversationID'] ?? '',
                'OriginatorConversationID'=> $data['OriginatorConversationID'] ?? '',
                'ResponseDescription'     => $desc,
                'amount'                  => $roundedAmount,
                'phone'                   => $formattedPhone,
                'status'                  => 'PROCESSING',
            ];
        }

        Logger::warning('Daraja B2C payout not accepted', $data);
        return [
            'success' => false,
            'error'   => $data['errorMessage'] ?? ($desc ?: 'Safaricom declined the B2C request.'),
            'raw'     => $data,
        ];
    }

    /**
     * Handles the async Safaricom B2C ResultURL callback.
     * Called after Safaricom successfully (or unsuccessfully) processes the payout.
     */
    public function handleB2cResult(array $payload): bool
    {
        Logger::info('Daraja B2C result callback received', $payload);

        $result = $payload['Result'] ?? null;
        if (!$result) {
            Logger::warning('B2C result callback missing Result key');
            return false;
        }

        $resultCode       = (int) ($result['ResultCode'] ?? -1);
        $resultDesc       = (string) ($result['ResultDesc'] ?? '');
        $conversationId   = (string) ($result['ConversationID'] ?? '');
        $origConvId       = (string) ($result['OriginatorConversationID'] ?? '');

        // Extract result parameters
        $params = [];
        foreach ($result['ResultParameters']['ResultParameter'] ?? [] as $param) {
            if (isset($param['Key'])) {
                $params[$param['Key']] = $param['Value'] ?? null;
            }
        }

        $transactionId  = (string) ($params['TransactionID']       ?? $conversationId);
        $amount         = (float)  ($params['TransactionAmount']   ?? 0);
        $recipientPhone = (string) ($params['ReceiverPartyPublicName'] ?? '');

        if ($resultCode === 0) {
            Logger::info('B2C payout SUCCESSFUL', [
                'transaction_id'  => $transactionId,
                'amount'          => $amount,
                'recipient'       => $recipientPhone,
                'conversation_id' => $conversationId,
            ]);
            // Mark payout as completed in the database
            $this->recordPayoutCompletion($origConvId, $transactionId, $amount, 'completed');
            return true;
        }

        Logger::warning('B2C payout FAILED', [
            'result_code'     => $resultCode,
            'result_desc'     => $resultDesc,
            'conversation_id' => $conversationId,
        ]);
        $this->recordPayoutCompletion($origConvId, $conversationId, $amount, 'failed');
        return false;
    }

    /**
     * Handles the B2C QueueTimeOutURL callback (Safaricom could not process in time).
     */
    public function handleB2cTimeout(array $payload): void
    {
        Logger::warning('Daraja B2C timeout callback received', $payload);
        $conversationId = $payload['Result']['ConversationID'] ?? 'unknown';
        $this->recordPayoutCompletion($conversationId, $conversationId, 0, 'timeout');
    }

    /**
     * Records the payout result in the `seller_payouts` table.
     */
    private function recordPayoutCompletion(
        string $conversationId,
        string $transactionId,
        float  $amount,
        string $status
    ): void {
        try {
            \App\Core\Database::execute(
                'UPDATE seller_payouts SET status = ?, mpesa_transaction_id = ?, updated_at = NOW()
                 WHERE conversation_id = ? OR originator_conversation_id = ?',
                [$status, $transactionId, $conversationId, $conversationId]
            );
        } catch (Throwable $e) {
            Logger::warning('Could not update seller_payouts table: ' . $e->getMessage());
        }
    }
}
