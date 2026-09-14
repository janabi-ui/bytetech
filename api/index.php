<?php
declare(strict_types=1);

/**
 * Byte Tech Ltd Marketplace — Enterprise API Gateway & Front Controller
 * 
 * High performance, zero-dependency REST API for Customer Storefront,
 * Merchant Dashboard, and Admin Control Center.
 */

// 1. Register PSR-4 Autoloader
require_once dirname(__DIR__) . '/backend/src/Core/Autoloader.php';
\App\Core\Autoloader::register(dirname(__DIR__) . '/backend/src');

use App\Core\Env;
use App\Core\Database;
use App\Core\Logger;
use App\Core\Request;
use App\Core\Router;
use App\Core\Middleware\CorsMiddleware;
use App\Core\Middleware\AuthMiddleware;
use App\Core\Middleware\AdminMiddleware;
use App\Core\Middleware\RateLimitMiddleware;
use App\Controllers\AuthController;
use App\Controllers\SellerController;
use App\Controllers\ProductController;
use App\Controllers\OrderController;
use App\Controllers\FiscalController;
use App\Controllers\AdminController;
use App\Controllers\PaymentController;
use App\Controllers\HealthController;

// 2. Load Environment Variables & Configurations
$projectRoot = dirname(__DIR__);
Env::load("{$projectRoot}/.env");

$appConfig = require "{$projectRoot}/backend/config/app.php";
$dbConfig = require "{$projectRoot}/backend/config/database.php";

// Set timezone
date_default_timezone_set($appConfig['app']['timezone'] ?? 'Africa/Nairobi');

// 3. Initialize Core Subsystems
Database::init($dbConfig);
Logger::init("{$projectRoot}/backend/logs");

// 4. Instantiate Request & Router
$request = new Request();
$router = new Router();

// 5. Global Middleware: CORS & Preflight handling
$router->use(new CorsMiddleware($appConfig['security']['cors_origins'] ?? []));

// ─────────────────────────────────────────────────────────────
// ROUTE REGISTRATION
// ─────────────────────────────────────────────────────────────

// ── Diagnostics & Telemetry ──
$adminMiddleware = new AdminMiddleware();
$router->get('/api/health', [HealthController::class, 'check']);
$router->get('/api/health/logs', [HealthController::class, 'logs'], [$adminMiddleware]);

// ── Merchant Authentication (Rate Limited) ──
$authRateLimiter = new RateLimitMiddleware(20, 60);
$router->post('/api/sellers/register', [AuthController::class, 'register'], [$authRateLimiter]);
$router->post('/api/sellers/login', [AuthController::class, 'login'], [$authRateLimiter]);

// ── Merchant Portal (JWT Protected) ──
$authMiddleware = new AuthMiddleware();
$router->get('/api/sellers/dashboard', [SellerController::class, 'dashboard'], [$authMiddleware]);
$router->get('/api/sellers/products', [SellerController::class, 'getProducts'], [$authMiddleware]);
$router->post('/api/sellers/products', [SellerController::class, 'addProduct'], [$authMiddleware]);
$router->post('/api/sellers/products/stock', [SellerController::class, 'updateStock'], [$authMiddleware]);
$router->delete('/api/sellers/products', [SellerController::class, 'deleteProduct'], [$authMiddleware]);
$router->post('/api/sellers/products/delete', [SellerController::class, 'deleteProduct'], [$authMiddleware]);
$router->post('/api/sellers/payout', [SellerController::class, 'requestPayout'], [$authMiddleware]);

// ── Storefront Orders & Checkout (Rate Limited) ──
$orderRateLimiter = new RateLimitMiddleware(30, 60);
$router->post('/api/orders/create', [OrderController::class, 'create'], [$orderRateLimiter]);
$router->get('/api/orders/get', [OrderController::class, 'get']);
$router->post('/api/orders/fiscalize', [FiscalController::class, 'fiscalize'], [$orderRateLimiter]);
$router->post('/api/orders/delete', [OrderController::class, 'delete'], [$orderRateLimiter]);
$router->delete('/api/orders', [OrderController::class, 'delete'], [$orderRateLimiter]);

// ── Public Storefront Catalog ──
$router->get('/api/products', [ProductController::class, 'listProducts']);
$router->get('/api/products/detail', [ProductController::class, 'getProduct']);

// ── Safaricom M-Pesa Daraja Payment Routes ──
$router->post('/api/payments/mpesa-stk', [PaymentController::class, 'stkPush'], [$orderRateLimiter]);
$router->post('/api/payments/mpesa-query', [PaymentController::class, 'queryStatus']);
$router->post('/api/payments/mpesa-callback', [PaymentController::class, 'callback']);
$router->post('/api/payments/verify', [PaymentController::class, 'verify'], [$orderRateLimiter]);

// ── Admin Control Center (PIN Protected & Rate Limited) ──
$adminRateLimiter = new RateLimitMiddleware(60, 60);
$router->get('/api/admin/summary', [AdminController::class, 'summary'], [$adminMiddleware, $adminRateLimiter]);
$router->get('/api/admin/orders', [AdminController::class, 'orders'], [$adminMiddleware, $adminRateLimiter]);
$router->get('/api/admin/commissions', [AdminController::class, 'commissions'], [$adminMiddleware, $adminRateLimiter]);
$router->post('/api/admin/commissions', [AdminController::class, 'updateCommission'], [$adminMiddleware, $adminRateLimiter]);
$router->post('/api/admin/sellers/status', [AdminController::class, 'toggleSellerStatus'], [$adminMiddleware, $adminRateLimiter]);
$router->post('/api/admin/sellers/rate', [AdminController::class, 'updateSellerRate'], [$adminMiddleware, $adminRateLimiter]);
$router->post('/api/admin/sellers/delete', [AdminController::class, 'deleteSeller'], [$adminMiddleware, $adminRateLimiter]);
$router->delete('/api/admin/sellers', [AdminController::class, 'deleteSeller'], [$adminMiddleware, $adminRateLimiter]);
$router->delete('/api/admin/products', [AdminController::class, 'deleteProduct'], [$adminMiddleware, $adminRateLimiter]);
$router->post('/api/admin/orders/delete', [AdminController::class, 'deleteOrder'], [$adminMiddleware, $adminRateLimiter]);
$router->delete('/api/admin/orders', [AdminController::class, 'deleteOrder'], [$adminMiddleware, $adminRateLimiter]);

// 6. Dispatch the request
$router->dispatch($request);
