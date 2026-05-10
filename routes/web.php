<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Models\Sale;
use App\Models\Product;

// Redirigir la raíz directamente al Punto de Venta
Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Dashboard sin restricciones
Route::get('/dashboard', function () {
    $totalVentasBs = Sale::sum('total_bs');
    $totalVentasUsd = Sale::sum('total_usd');
    $cantidadVentas = Sale::count();
    $ventasRecientes = Sale::with('items.product')->latest()->take(5)->get();

    return Inertia::render('Dashboard', [
        'totalVentasBs' => $totalVentasBs,
        'totalVentasUsd' => $totalVentasUsd,
        'cantidadVentas' => $cantidadVentas,
        'ventasRecientes' => $ventasRecientes,
    ]);
})->name('dashboard');

// Rutas de gestión y ventas sin restricciones
Route::resource('categories', CategoryController::class);
Route::resource('products', ProductController::class);
Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');

Route::get('/pos', function () {
    return Inertia::render('POS/Index', [
        'products' => Product::with('category')->where('stock', '>', 0)->get()
    ]);
})->name('pos.index');