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