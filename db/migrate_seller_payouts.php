<?php
/**
 * Migration: Create seller_payouts table
 * Run once: php db/migrate_seller_payouts.php
 */

require_once __DIR__ . '/../backend/src/Core/Autoloader.php';
\App\Core\Autoloader::register(__DIR__ . '/../backend/src');

\App\Core\Env::load(__DIR__ . '/../.env');
$dbConfig = require __DIR__ . '/../backend/config/database.php';
\App\Core\Database::init($dbConfig);

$sql = "
CREATE TABLE IF NOT EXISTS seller_payouts (
    id                          VARCHAR(36)     NOT NULL PRIMARY KEY,
    seller_id                   VARCHAR(36)     NOT NULL,
    amount                      DECIMAL(12,2)   NOT NULL DEFAULT 0,
    phone                       VARCHAR(20)     NOT NULL DEFAULT '',
    status                      ENUM('pending','processing','completed','failed','timeout')
                                NOT NULL DEFAULT 'pending',
    payout_ref                  VARCHAR(60)     NOT NULL DEFAULT '',
    conversation_id             VARCHAR(100)    NOT NULL DEFAULT '',
    originator_conversation_id  VARCHAR(100)    NOT NULL DEFAULT '',
    mpesa_transaction_id        VARCHAR(100)    NOT NULL DEFAULT '',
    created_at                  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_seller_id  (seller_id),
    INDEX idx_conv_id    (conversation_id),
    INDEX idx_status     (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

try {
    \App\Core\Database::execute($sql);
    echo "✅ seller_payouts table created (or already exists).\n";
} catch (Throwable $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
