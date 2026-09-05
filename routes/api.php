<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\BusinessController;
use App\Http\Controllers\Api\V1\BusinessSettingController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\ExchangeRateController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\InventoryMovementController;
use App\Http\Controllers\Api\V1\PaymentMethodController;
use App\Http\Controllers\Api\V1\PaymentTypeController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\RestockController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\Analytics\CustomerAnalyticsController;
use App\Http\Controllers\Api\V1\Analytics\DashboardAnalyticsController;
use App\Http\Controllers\Api\V1\Analytics\FinancialAnalyticsController;
use App\Http\Controllers\Api\V1\Analytics\InventoryAnalyticsController;
use App\Http\Controllers\Api\V1\Analytics\OperationsAnalyticsController;
use App\Http\Controllers\Api\V1\Analytics\SalesAnalyticsController;
use App\Http\Controllers\Api\V1\Analytics\SupplierAnalyticsController;
use App\Http\Controllers\Api\V1\Auth\AuthenticatedSessionController;

/*
|--------------------------------------------------------------------------
| Rutas Públicas / Autenticación
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthenticatedSessionController::class, 'login']);
        Route::post('register', [AuthenticatedSessionController::class, 'register']);
        /*
        Route::post('forgot-password', [PasswordResetLinkController::class, 'sendResetLinkEmail']);
        Route::post('reset-password', [PasswordResetLinkController::class, 'resetPassword']);
        */
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthenticatedSessionController::class, 'logout']);
            Route::get('me', [AuthenticatedSessionController::class, 'me']);
            Route::post('refresh', [AuthenticatedSessionController::class, 'refresh']);
            Route::get('check-status', [AuthenticatedSessionController::class, 'checkStatus']);
        });
    });


    /*
    |--------------------------------------------------------------------------
    | Rutas Protegidas (Autenticadas + Multi-tenant Scope)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum', 'business.context'])->group(function () {

        // =========================================================================
        // 1. SOLO SUPERADMIN (Control total del sistema)
        // =========================================================================
        Route::middleware(['role:superadmin'])->group(function () {

            // Negocios (Solo el superadmin crea, lista todos o elimina)
            Route::post('businesses/bulk-destroy', [BusinessController::class, 'bulkDestroy']);
            Route::apiResource('businesses', BusinessController::class)->only(['index', 'store', 'destroy']);

            // Roles y Permisos (Intocables para el "own")
            Route::apiResource('roles', RoleController::class);
            Route::get('permissions', [PermissionController::class, 'index']);
        });

        // =========================================================================
        // 2. SUPERADMIN + OWN (Dueños y Superadmin)
        // =========================================================================
        Route::middleware(['role:superadmin|own'])->group(function () {

            // Negocios (El owner solo puede ver y actualizar el suyo)
            Route::get('businesses/current', [BusinessController::class, 'current']);
            Route::patch('businesses/{business}/status', [BusinessController::class, 'toggleStatus']);
            Route::apiResource('businesses', BusinessController::class)->only(['show', 'update']);

            // Configuración del Negocio
            Route::prefix('business-settings')->group(function () {
                Route::get('/', [BusinessSettingController::class, 'show']);
                Route::put('/', [BusinessSettingController::class, 'update']);
                Route::post('/exchanger-rate', [BusinessSettingController::class, 'updateExchangeRate']);
            });

            // Productos y Categorías (Creación, edición y eliminación)
            Route::post('categories/bulk-destroy', [CategoryController::class, 'bulkDestroy']);
            Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);

            Route::post('products/bulk-destroy', [ProductController::class, 'bulkDestroy']);
            Route::apiResource('products', ProductController::class)->except(['index', 'show']);

            // Inventario (Movimientos y Compras)
            Route::get('inventory-movements', [InventoryMovementController::class, 'index']);
            Route::get('inventory-movements/{inventoryMovement}', [InventoryMovementController::class, 'show']);
            Route::apiResource('restocks', RestockController::class);

            // Métodos y Tipos de Pago
            Route::post('payment-types/{paymentType}/toggleStatus', [PaymentTypeController::class, 'updateExchangeRate']);
            Route::apiResource('payment-types', PaymentTypeController::class);

            Route::post('payment-methods/bulk-destroy', [PaymentMethodController::class, 'bulkDestroy']);
            Route::post('payment-methods/{paymentMethod}/toggleStatus', [PaymentMethodController::class, 'updateExchangeRate']);
            Route::apiResource('payment-methods', PaymentMethodController::class);

            // Tasas de Cambio
            Route::get('exchange-rates/current', [ExchangeRateController::class, 'current']);
            Route::apiResource('exchange-rates', ExchangeRateController::class);

            // Gastos
            Route::get('expenses/summary', [ExpenseController::class, 'summary']);
            Route::apiResource('expenses', ExpenseController::class);

            // Usuarios
            Route::post('users/bulk-destroy', [UserController::class, 'bulkDestroy']);
            Route::apiResource('users', UserController::class);
        });


        // =========================================================================
        // 3. SUPERADMIN + OWN + CASHIER (Vendedores y todo el personal superior)
        // =========================================================================
        Route::middleware(['role:superadmin|own|cashier'])->group(function () {

            // Productos y Categorías (Solo lectura para el cajero)
            Route::get('categories/tree', [CategoryController::class, 'tree']);
            Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);
            Route::apiResource('products', ProductController::class)->only(['index', 'show']);

            // Clientes (Acceso total: buscar, registrar nuevos)
            Route::post('customers/bulk-destroy', [CustomerController::class, 'bulkDestroy']);
            Route::apiResource('customers', CustomerController::class);

            // Ventas (Acceso total: registrar ventas, agregar pagos)
            Route::post('sales/add-payment', [SaleController::class, 'addPayment']);
            Route::apiResource('sales', SaleController::class);
        });
    });


    /*
    |--------------------------------------------------------------------------
    | Métricas, KPIs y Dashboard Analytics (Solo Superadmin y Own)
    |--------------------------------------------------------------------------
    */

    /*
    Route::middleware(['auth:sanctum', 'business.context', 'role:superadmin|own'])->prefix('analytics')->group(function () {

        Route::get('dashboard', DashboardAnalyticsController::class);

        Route::prefix('sales')->group(function () {
            Route::get('summary', [SalesAnalyticsController::class, 'summary']);
            Route::get('top-products', [SalesAnalyticsController::class, 'topProducts']);
            Route::get('by-payment-method', [SalesAnalyticsController::class, 'byPaymentMethod']);
            Route::get('hourly-traffic', [SalesAnalyticsController::class, 'hourlyTraffic']);
            Route::get('by-category', [SalesAnalyticsController::class, 'byCategory']);
        });

        Route::prefix('inventory')->group(function () {
            Route::get('valuation', [InventoryAnalyticsController::class, 'valuation']);
            Route::get('low-stock-summary', [InventoryAnalyticsController::class, 'lowStockSummary']);
            Route::get('dead-stock', [InventoryAnalyticsController::class, 'deadStock']);
            Route::get('rotation-rate', [InventoryAnalyticsController::class, 'rotationRate']);
            Route::get('shrinkage', [InventoryAnalyticsController::class, 'shrinkage']);
        });

        Route::prefix('financial')->group(function () {
            Route::get('profit-loss', [FinancialAnalyticsController::class, 'profitLoss']);
            Route::get('reinvestment-fund', [FinancialAnalyticsController::class, 'reinvestmentFund']);
            Route::get('expenses-breakdown', [FinancialAnalyticsController::class, 'expensesBreakdown']);
            Route::get('currency-balance', [FinancialAnalyticsController::class, 'currencyBalance']);
        });

        Route::prefix('customers')->group(function () {
            Route::get('top-buyers', [CustomerAnalyticsController::class, 'topBuyers']);
            Route::get('retention-rfm', [CustomerAnalyticsController::class, 'retentionRfm']);
            Route::get('accounts-receivable', [CustomerAnalyticsController::class, 'accountsReceivable']);
        });

        Route::prefix('suppliers')->group(function () {
            Route::get('restock-summary', [SupplierAnalyticsController::class, 'restockSummary']);
            Route::get('cost-trends', [SupplierAnalyticsController::class, 'costTrends']);
        });

        Route::prefix('operations')->group(function () {
            Route::get('performance-by-user', [OperationsAnalyticsController::class, 'performanceByUser']);
        });

    });
    */
});