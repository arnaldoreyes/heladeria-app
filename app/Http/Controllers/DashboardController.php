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

        // 1. Agregaciones SQL del MES EN CURSO (Ultra-rápido, sin hidración masiva de modelos)
        $monthQuery = Sale::whereMonth('created_at', $currentMonth)->whereYear('created_at', $currentYear);
        $monthStats = $monthQuery->select(
            DB::raw('COALESCE(SUM(total_bs), 0) as total_bs'),
            DB::raw('COALESCE(SUM(total_usd), 0) as total_usd'),
            DB::raw('COALESCE(SUM(cost_usd), 0) as cost_usd'),
            DB::raw('COALESCE(SUM(margin_usd), 0) as margin_usd'),
            DB::raw('COALESCE(SUM(reinvestment_usd), 0) as reinvestment_usd'),
            DB::raw('COALESCE(SUM(profit_usd), 0) as profit_usd'),
            DB::raw('COUNT(*) as cantidad_ventas'),
            DB::raw('COALESCE(SUM(change_loss_bs), 0) as total_perdida_bs'),
            DB::raw('COALESCE(SUM(CASE WHEN tasa_bcv > 0 THEN change_loss_bs / tasa_bcv ELSE 0 END), 0) as total_perdida_usd')
        )->first();

        // 2. Agregaciones de HOY
        $todayQuery = Sale::whereDate('created_at', $today);
        $todayStats = $todayQuery->select(
            DB::raw('COALESCE(SUM(total_usd), 0) as total_usd'),
            DB::raw('COALESCE(SUM(total_bs), 0) as total_bs')
        )->first();

        // 3. Ventas Recientes (Strictly lo de HOY)
        $ventasRecientes = Sale::with('items.product')
            ->whereDate('created_at', $today)
            ->latest()
            ->get();

        // 4. Ranking global de productos (Filtrado por el MES)
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
                    'total_vendido' => (int) $item->total_vendido
                ];
            });

        // 5. Historial Mensual Agrupado en SQL
        $monthlyHistoryRows = Sale::select(
            DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month_key"),
            DB::raw("COUNT(*) as sales_count"),
            DB::raw("COALESCE(SUM(total_usd), 0) as total_usd"),
            DB::raw("COALESCE(SUM(total_bs), 0) as total_bs"),
            DB::raw("COALESCE(SUM(cost_usd), 0) as total_cost_usd"),
            DB::raw("COALESCE(SUM(margin_usd), 0) as total_margin_usd"),
            DB::raw("COALESCE(SUM(reinvestment_usd), 0) as reinvestment_usd"),
            DB::raw("COALESCE(SUM(profit_usd), 0) as profit_usd"),
            DB::raw("COALESCE(SUM(change_loss_bs), 0) as total_loss_bs"),
            DB::raw("COALESCE(SUM(CASE WHEN tasa_bcv > 0 THEN change_loss_bs / tasa_bcv ELSE 0 END), 0) as total_loss_usd")
        )
        ->groupBy('month_key')
        ->orderByDesc('month_key')
        ->get();

        $monthlyHistory = $monthlyHistoryRows->map(function($row) {
            $date = Carbon::createFromFormat('Y-m', $row->month_key)->locale('es');
            return [
                'id' => $row->month_key,
                'month_name' => ucfirst($date->translatedFormat('F Y')), 
                'sales_count' => (int) $row->sales_count,
                'total_usd' => (float) $row->total_usd,
                'total_bs' => (float) $row->total_bs,
                'total_cost_usd' => (float) $row->total_cost_usd,
                'total_margin_usd' => (float) $row->total_margin_usd,
                'reinvestment_usd' => (float) $row->reinvestment_usd,
                'profit_usd' => (float) $row->profit_usd,
                'total_loss_usd' => (float) $row->total_loss_usd,
                'total_loss_bs' => (float) $row->total_loss_bs,
            ];
        })->values();

        return Inertia::render('Dashboard', [
            'totalVentasBs' => (float) $monthStats->total_bs,
            'totalVentasUsd' => (float) $monthStats->total_usd,
            'totalCostUsd' => (float) $monthStats->cost_usd,
            'totalMarginUsd' => (float) $monthStats->margin_usd,
            'totalReinvestmentUsd' => (float) $monthStats->reinvestment_usd,
            'totalProfitUsd' => (float) $monthStats->profit_usd,
            'cantidadVentas' => (int) $monthStats->cantidad_ventas,
            'totalHoyUsd' => (float) $todayStats->total_usd,
            'totalHoyBs' => (float) $todayStats->total_bs,
            'ventasRecientes' => $ventasRecientes,
            'totalPerdidaBs' => (float) $monthStats->total_perdida_bs,
            'totalPerdidaUsd' => (float) $monthStats->total_perdida_usd,
            'topProductos' => $topProductos,
            'monthlyHistory' => $monthlyHistory
        ]);
    }
}