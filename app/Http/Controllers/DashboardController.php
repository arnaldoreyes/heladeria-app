<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $totalVentasBs = Sale::sum('total_bs');
        $totalVentasUsd = Sale::sum('total_usd');
        $cantidadVentas = Sale::count();
        $ventasRecientes = Sale::with('items.product')->latest()->take(5)->get();

        $totalPerdidaBs = Sale::sum('change_loss_bs');
        $totalPerdidaUsd = Sale::where('change_loss_bs', '>', 0)->get()->sum(function ($sale) {
            return $sale->tasa_bcv > 0 ? ($sale->change_loss_bs / $sale->tasa_bcv) : 0;
        });

        // --- GANANCIAS POR TETAS ---
        $ventasTetasBs = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('products.category_id', 1)
            ->sum(DB::raw('sale_items.quantity * sale_items.price_bs'));

        $ventasTetasUsd = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('products.category_id', 1)
            ->where('sales.tasa_bcv', '>', 0)
            ->sum(DB::raw('sale_items.quantity * (sale_items.price_bs / sales.tasa_bcv)'));

        // --- GANANCIAS POR HELADOS ---
        $ventasHeladosBs = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('products.category_id', 2)
            ->sum(DB::raw('sale_items.quantity * sale_items.price_bs'));

        $ventasHeladosUsd = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('products.category_id', 2)
            ->where('sales.tasa_bcv', '>', 0)
            ->sum(DB::raw('sale_items.quantity * (sale_items.price_bs / sales.tasa_bcv)'));

        // --- RANKING GLOBAL DE PRODUCTOS ---
        $topProductos = SaleItem::select('product_id', DB::raw('SUM(quantity) as total_vendido'))
            ->with('product.category')
            ->groupBy('product_id')
            ->orderByDesc('total_vendido')
            ->get() // Obtenemos todo para que React arme el Top 3 y el Top Global
            ->map(function ($item) {
                return [
                    'id' => $item->product->id ?? null,
                    'name' => $item->product->name ?? 'Eliminado',
                    'category_id' => $item->product->category_id ?? null,
                    'total_vendido' => $item->total_vendido
                ];
            });

        return Inertia::render('Dashboard', [
            'totalVentasBs' => $totalVentasBs,
            'totalVentasUsd' => $totalVentasUsd,
            'cantidadVentas' => $cantidadVentas,
            'ventasRecientes' => $ventasRecientes,
            'totalPerdidaBs' => $totalPerdidaBs,
            'totalPerdidaUsd' => $totalPerdidaUsd,
            'ventasTetasBs' => $ventasTetasBs,
            'ventasTetasUsd' => $ventasTetasUsd,
            'ventasHeladosBs' => $ventasHeladosBs,
            'ventasHeladosUsd' => $ventasHeladosUsd,
            'topProductos' => $topProductos
        ]);
    }
}