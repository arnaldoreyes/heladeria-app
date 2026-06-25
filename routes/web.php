<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PosController;

// Redirigir la raíz directamente al Punto de Venta
Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Dashboard y POS
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::get('/pos', [PosController::class, 'index'])->name('pos.index');

// Rutas Masivas para el Inventario
Route::post('/products/bulk-delete', [ProductController::class, 'bulkDestroy'])->name('products.bulkDestroy');
Route::post('/products/bulk-update', [ProductController::class, 'bulkUpdate'])->name('products.bulkUpdate');

// Rutas de gestión y ventas
Route::resource('categories', CategoryController::class);
Route::resource('products', ProductController::class);
Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
Route::put('/sales/{sale}', [SaleController::class, 'update'])->name('sales.update');

Route::post('/products/restock', [App\Http\Controllers\ProductController::class, 'restock'])->name('products.restock');

// Modulo de Configuracion
Route::get('/settings', [App\Http\Controllers\SettingController::class, 'index'])->name('settings.index');
Route::post('/settings', [App\Http\Controllers\SettingController::class, 'update'])->name('settings.update');
Route::post('/settings/force-api', [App\Http\Controllers\SettingController::class, 'forceApiRefresh'])->name('settings.forceApi');

// Módulo de Finanzas
Route::get('/finances', [App\Http\Controllers\FinanceController::class, 'index'])->name('finances.index');
Route::post('/finances/expenses', [App\Http\Controllers\FinanceController::class, 'storeExpense'])->name('expenses.store');
Route::delete('/finances/expenses/{expense}', [App\Http\Controllers\FinanceController::class, 'destroyExpense'])->name('expenses.destroy');