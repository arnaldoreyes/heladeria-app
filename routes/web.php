<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PosController;

// Redirigir la raíz directamente al Punto de Venta (Optimizado para Route Caching)
Route::redirect('/', '/dashboard');

// Dashboard y POS
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::get('/pos', [PosController::class, 'index'])->name('pos.index');

// Rutas Masivas y Generales para el Inventario
Route::controller(ProductController::class)->prefix('products')->name('products.')->group(function () {
    Route::post('/bulk-delete', 'bulkDestroy')->name('bulkDestroy');
    Route::post('/bulk-update', 'bulkUpdate')->name('bulkUpdate');
    Route::post('/restock', 'restock')->name('restock');
});

// Rutas de gestión y ventas
Route::resource('categories', CategoryController::class);
Route::resource('products', ProductController::class);

Route::controller(SaleController::class)->prefix('sales')->name('sales.')->group(function () {
    Route::post('/', 'store')->name('store');
    Route::put('/{sale}', 'update')->name('update');
});

// Modulo de Configuracion
Route::controller(App\Http\Controllers\SettingController::class)->prefix('settings')->name('settings.')->group(function () {
    Route::get('/', 'index')->name('index');
    Route::post('/', 'update')->name('update');
    Route::post('/force-api', 'forceApiRefresh')->name('forceApi');
});

// Módulo de Finanzas
Route::controller(App\Http\Controllers\FinanceController::class)->prefix('finances')->name('finances.')->group(function () {
    Route::get('/', 'index')->name('index');
    Route::post('/expenses', 'storeExpense')->name('expenses.store');
    Route::delete('/expenses/{expense}', 'destroyExpense')->name('expenses.destroy');
});