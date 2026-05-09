<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Models\Sale;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
    // 1. Sumamos las columnas de la tabla sales
    $totalVentasBs = Sale::sum('total_bs');
    $totalVentasUsd = Sale::sum('total_usd');
    
    // Contamos cuántas ventas (tickets) se han hecho en total
    $cantidadVentas = Sale::count();

    // Buscamos las últimas 5 ventas ordenadas por la más reciente
    $ventasRecientes = App\Models\Sale::with('items.product')->latest()->take(5)->get();

    // 2. Enviamos la data a la vista de React
    return Inertia::render('Dashboard', [
        'totalVentasBs' => $totalVentasBs,
        'totalVentasUsd' => $totalVentasUsd,
        'cantidadVentas' => $cantidadVentas,
        'ventasRecientes' => $ventasRecientes,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

    Route::resource('categories', CategoryController::class);
    Route::resource('products', ProductController::class);
    Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
    Route::get('/pos', function () {
        return inertia('POS/Index', [
            'products' => App\Models\Product::with('category')->where('stock', '>', 0)->get()
        ]);
    })->name('pos');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
