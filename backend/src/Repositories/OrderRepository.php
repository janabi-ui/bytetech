<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use App\Core\Security\Sanitizer;

/**
 * Enterprise Order Repository
 * Manages orders, itemized line splits, transactional order auditing, and financial metrics.
 */
class OrderRepository
{
    public function createOrder(array $data): string
    {
        $id = $data['id'] ?? Sanitizer::generateOrderId();
        $customerName = Sanitizer::string($data['customer_name'] ?? '');
        $customerEmail = Sanitizer::email($data['customer_email'] ?? '') ?? '';
        $customerPhone = Sanitizer::kenyanPhone($data['customer_phone'] ?? null);
        $shippingAddress = Sanitizer::string($data['shipping_address'] ?? 'Nairobi/Mombasa Delivery Hub', 500);
        $totalAmount = Sanitizer::price($data['total_amount'] ?? 0);
        $currency = $data['currency'] ?? 'KES';
        $paymentMethod = Sanitizer::string($data['payment_method'] ?? 'M-Pesa');
        $flwTxId = Sanitizer::string($data['flw_transaction_id'] ?? null);
        $flwTxRef = Sanitizer::string($data['flw_tx_ref'] ?? $id);
        $status = $data['status'] ?? 'paid'; // In live M-Pesa STK or mock flow, completed checkout marks paid

        $sql = 'INSERT INTO orders (
                    id, customer_name, customer_email, customer_phone, shipping_address,
                    total_amount, currency, payment_method, flw_transaction_id, flw_tx_ref, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        Database::execute($sql, [
            $id,
            $customerName,
            $customerEmail,
            $customerPhone,
            $shippingAddress,
            $totalAmount,
            $currency,
            $paymentMethod,
            $flwTxId,
            $flwTxRef,
            $status
        ]);

        return $id;
    }

    public function createOrderItem(array $item): int
    {
        $sql = 'INSERT INTO order_items (
                    order_id, product_id, seller_id, product_name, product_image, seller_name,
                    quantity, unit_price, total_price, commission_rate, platform_fee, seller_earning
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        return Database::insert($sql, [
            $item['order_id'],
            $item['product_id'] ?? null,
            $item['seller_id'] ?? null,
            Sanitizer::string($item['product_name'] ?? 'Hardware Item'),
            $item['product_image'] ?? null,
            Sanitizer::string($item['seller_name'] ?? 'Byte Tech Partner'),
            Sanitizer::int($item['quantity'] ?? 1, 1),
            Sanitizer::price($item['unit_price'] ?? 0),
            Sanitizer::price($item['total_price'] ?? 0),
            (float)($item['commission_rate'] ?? 0.10),
            Sanitizer::price($item['platform_fee'] ?? 0),
            Sanitizer::price($item['seller_earning'] ?? 0),
        ]);
    }

    public function findById(string $id): ?array
    {
        $sql = 'SELECT * FROM orders WHERE id = ? LIMIT 1';
        return Database::selectOne($sql, [$id]);
    }

    /**
     * Resolves an order by exact Receipt ID, payment reference, or customer phone number
     */
    public function findByIdOrCustomer(string $query): ?array
    {
        $clean = trim($query);
        if (empty($clean)) {
            return null;
        }

        // 1. Direct match by Order/Receipt ID, flw_tx_ref, or flw_transaction_id
        $sql = 'SELECT * FROM orders WHERE id = ? OR flw_tx_ref = ? OR flw_transaction_id = ? LIMIT 1';
        $order = Database::selectOne($sql, [$clean, $clean, $clean]);
        if ($order) {
            return $order;
        }

        // 2. Lookup by Customer Phone Number (supports local 07... and intl 254... variations)
        $digits = preg_replace('/\D/', '', $clean);
        if (strlen($digits) >= 9) {
            $variants = [$digits];
            if (str_starts_with($digits, '0') && strlen($digits) === 10) {
                $variants[] = '254' . substr($digits, 1);
                $variants[] = '+254' . substr($digits, 1);
            } elseif (str_starts_with($digits, '254') && strlen($digits) === 12) {
                $variants[] = '0' . substr($digits, 3);
                $variants[] = '+' . $digits;
            } elseif (strlen($digits) === 9) {
                $variants[] = '0' . $digits;
                $variants[] = '254' . $digits;
                $variants[] = '+254' . $digits;
            }

            $uniqueVariants = array_values(array_unique($variants));
            $placeholders = implode(',', array_fill(0, count($uniqueVariants), '?'));
            $phoneSql = "SELECT * FROM orders WHERE customer_phone IN ({$placeholders}) ORDER BY created_at DESC LIMIT 1";
            $order = Database::selectOne($phoneSql, $uniqueVariants);
            if ($order) {
                return $order;
            }
        }

        // 3. Partial substring match on order id (e.g. searching without BT01- prefix)
        $likeSql = 'SELECT * FROM orders WHERE id LIKE ? ORDER BY created_at DESC LIMIT 1';
        return Database::selectOne($likeSql, ['%' . $clean . '%']);
    }

    public function findWithItems(string $idOrCustomer): ?array
    {
        $order = $this->findByIdOrCustomer($idOrCustomer);
        if (!$order) {
            return null;
        }

        $itemsSql = 'SELECT * FROM order_items WHERE order_id = ?';
        $order['items'] = Database::select($itemsSql, [$order['id']]);

        return $order;
    }

    public function updateFiscalData(string $orderId, array $fiscal): bool
    {
        $sql = 'UPDATE orders SET 
                    kra_cu_number = ?, 
                    kra_invoice_number = ?, 
                    kra_qr_url = ? 
                WHERE id = ?';

        return Database::execute($sql, [
            $fiscal['kra_cu_number'] ?? null,
            $fiscal['kra_invoice_number'] ?? null,
            $fiscal['kra_qr_url'] ?? null,
            $orderId
        ]) > 0;
    }

    public function updateStatus(string $orderId, string $status, ?string $txId = null): bool
    {
        if ($txId) {
            $sql = 'UPDATE orders SET status = ?, flw_transaction_id = ? WHERE id = ?';
            return Database::execute($sql, [$status, $txId, $orderId]) > 0;
        }

        $sql = 'UPDATE orders SET status = ? WHERE id = ?';
        return Database::execute($sql, [$status, $orderId]) > 0;
    }

    public function delete(string $orderId): bool
    {
        return Database::transaction(function () use ($orderId) {
            Database::execute('DELETE FROM order_items WHERE order_id = ?', [$orderId]);
            return Database::execute('DELETE FROM orders WHERE id = ?', [$orderId]) > 0;
        });
    }

    public function getRecentOrders(int $limit = 20): array
    {
        $sql = 'SELECT o.id, o.customer_name, o.customer_email, o.total_amount, o.currency,
                       o.payment_method, o.status, o.created_at,
                       COALESCE(MAX(oi.product_name), "Hardware Order") as product_name,
                       COALESCE(MAX(oi.seller_name), "Byte Tech Direct") as seller_name
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                GROUP BY o.id
                ORDER BY o.created_at DESC
                LIMIT ?';

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(1, $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getPlatformTotals(): array
    {
        // 1. Total GMV and Order counts
        $sql = 'SELECT 
                    COALESCE(SUM(total_amount), 0) as total_gmv,
                    COUNT(*) as total_orders
                FROM orders';
        $ordersStats = Database::selectOne($sql) ?? ['total_gmv' => 0, 'total_orders' => 0];

        // 2. Total platform revenue from commission fees
        $feesSql = 'SELECT COALESCE(SUM(platform_fee), 0) as total_platform_revenue FROM order_items';
        $feeStats = Database::selectOne($feesSql) ?? ['total_platform_revenue' => 0];

        // 3. Active sellers count
        $sellerSql = 'SELECT COUNT(*) as active_sellers FROM sellers WHERE is_active = 1';
        $sellerStats = Database::selectOne($sellerSql) ?? ['active_sellers' => 0];

        return [
            'total_gmv'              => (float)($ordersStats['total_gmv'] ?? 0),
            'total_orders'           => (int)($ordersStats['total_orders'] ?? 0),
            'total_platform_revenue' => (float)($feeStats['total_platform_revenue'] ?? 0),
            'active_sellers'         => (int)($sellerStats['active_sellers'] ?? 0),
        ];
    }

    public function getSellerOrders(string $sellerId, int $limit = 50): array
    {
        $sql = 'SELECT oi.*, o.customer_name, o.customer_email, o.customer_phone, o.payment_method, o.status as order_status, o.created_at as order_created_at
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE oi.seller_id = ?
                ORDER BY oi.id DESC
                LIMIT ?';

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(1, $sellerId, \PDO::PARAM_STR);
        $stmt->bindValue(2, $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
