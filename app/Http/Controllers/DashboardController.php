<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today();
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        // 1. Consulta base: Todo lo del MES EN CURSO
        $monthSales = Sale::whereMonth('created_at', $currentMonth)
                          ->whereYear('created_at', $currentYear)->get();

        // 2. Totales globales del MES (Para la tarjeta principal)
        $totalVentasBs = $monthSales->sum('total_bs');
        $totalVentasUsd = $monthSales->sum('total_usd');
        $cantidadVentas = $monthSales->count();

        // 3. Control de fugas del MES
        $totalPerdidaBs = $monthSales->sum('change_loss_bs');
        $totalPerdidaUsd = $monthSales->where('change_loss_bs', '>', 0)->sum(function ($sale) {
            return $sale->tasa_bcv > 0 ? ($sale->change_loss_bs / $sale->tasa_bcv) : 0;
        });

        // 4. Totales y Tickets de HOY (Para no tener que cambiar pestañas)
        $todaySales = $monthSales->where('created_at', '>=', $today);
        $totalHoyUsd = $todaySales->sum('total_usd');
        $totalHoyBs = $todaySales->sum('total_bs');
        
        // Ventas Recientes ahora muestra estrictamente lo de HOY
        $ventasRecientes = Sale::with('items.product')
            ->whereDate('created_at', $today)
            ->latest()
            ->get();

        // 5. Ranking global de productos (Filtrado por el MES)
        $topProductos = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->select('product_id', DB::raw('SUM(quantity) as total_vendido'))
            ->whereMonth('sales.created_at', $currentMonth)
            ->whereYear('sales.created_at', $currentYear)
            ->with('product')
            ->groupBy('product_id')
            ->orderByDesc('total_vendido')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->product->id ?? null,
                    'name' => $item->product->name ?? 'Eliminado',
                    'total_vendido' => $item->total_vendido
                ];
            });

        // 6. Historial Mensual Agrupado (Todos los meses para el Sidebar)
        $allSales = Sale::all();
        $monthlyHistory = $allSales->groupBy(function($val) {
            return Carbon::parse($val->created_at)->format('Y-m');
        })->map(function($monthSalesGroup, $key) {
            $date = Carbon::createFromFormat('Y-m', $key)->locale('es');
            $totalLossUsd = $monthSalesGroup->sum(function($s) {
                return $s->tasa_bcv > 0 ? ($s->change_loss_bs / $s->tasa_bcv) : 0;
            });
            return [
                'id' => $key,
                'month_name' => ucfirst($date->translatedFormat('F Y')), 
                'sales_count' => $monthSalesGroup->count(),
                'total_usd' => (float) $monthSalesGroup->sum('total_usd'),
                'total_bs' => (float) $monthSalesGroup->sum('total_bs'),
                'total_loss_usd' => $totalLossUsd,
                'total_loss_bs' => (float) $monthSalesGroup->sum('change_loss_bs'),
            ];
        })->sortByDesc('id')->values();

        return Inertia::render('Dashboard', [
            'totalVentasBs' => $totalVentasBs,
            'totalVentasUsd' => $totalVentasUsd,
            'cantidadVentas' => $cantidadVentas,
            'totalHoyUsd' => $totalHoyUsd,
            'totalHoyBs' => $totalHoyBs,
            'ventasRecientes' => $ventasRecientes,
            'totalPerdidaBs' => $totalPerdidaBs,
            'totalPerdidaUsd' => $totalPerdidaUsd,
            'topProductos' => $topProductos,
            'monthlyHistory' => $monthlyHistory
        ]);
    }
}