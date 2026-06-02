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
        // 1. Recibir el período seleccionado (por defecto 'today')
        $period = request('period', 'today');

        // 2. Crear una consulta base filtrada por fecha para el Dashboard "en vivo"
        $query = Sale::query();

        if ($period === 'today') {
            $query->whereDate('created_at', Carbon::today());
        } elseif ($period === 'week') {
            $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
        } elseif ($period === 'month') {
            $query->whereMonth('created_at', Carbon::now()->month)->whereYear('created_at', Carbon::now()->year);
        }

        // 3. Totales globales del período en curso
        $totalVentasBs = (clone $query)->sum('total_bs');
        $totalVentasUsd = (clone $query)->sum('total_usd');
        $cantidadVentas = (clone $query)->count();

        // 4. Control de fugas del período en curso
        $totalPerdidaBs = (clone $query)->sum('change_loss_bs');
        $totalPerdidaUsd = (clone $query)->where('change_loss_bs', '>', 0)->get()->sum(function ($sale) {
            return $sale->tasa_bcv > 0 ? ($sale->change_loss_bs / $sale->tasa_bcv) : 0;
        });

        // 5. Desglose de ingresos por Método de Pago
        $metodosPago = (clone $query)
            ->select('payment_method', DB::raw('SUM(total_usd) as total_usd'), DB::raw('SUM(total_bs) as total_bs'))
            ->groupBy('payment_method')
            ->get();

        // 6. Ventas Recientes (Últimas 5 del período)
        $ventasRecientes = (clone $query)->with('items.product')->latest()->take(5)->get();

        // 7. Ranking global de productos (Filtrado por el período)
        $topProductos = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->select('product_id', DB::raw('SUM(quantity) as total_vendido'))
            ->when($period === 'today', fn($q) => $q->whereDate('sales.created_at', Carbon::today()))
            ->when($period === 'week', fn($q) => $q->whereBetween('sales.created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]))
            ->when($period === 'month', fn($q) => $q->whereMonth('sales.created_at', Carbon::now()->month)->whereYear('sales.created_at', Carbon::now()->year))
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

        // 8. NUEVO: Historial Mensual Agrupado (Todos los meses de la vida de la app)
        $allSales = Sale::all();
        $monthlyHistory = $allSales->groupBy(function($val) {
            return Carbon::parse($val->created_at)->format('Y-m');
        })->map(function($monthSales, $key) {
            $date = Carbon::createFromFormat('Y-m', $key)->locale('es');
            $totalLossUsd = $monthSales->sum(function($s) {
                return $s->tasa_bcv > 0 ? ($s->change_loss_bs / $s->tasa_bcv) : 0;
            });
            return [
                'id' => $key,
                'month_name' => ucfirst($date->translatedFormat('F Y')), // Ej: "Junio 2026"
                'sales_count' => $monthSales->count(),
                'total_usd' => (float) $monthSales->sum('total_usd'),
                'total_bs' => (float) $monthSales->sum('total_bs'),
                'total_loss_usd' => $totalLossUsd,
                'total_loss_bs' => (float) $monthSales->sum('change_loss_bs'),
            ];
        })->sortByDesc('id')->values();

        return Inertia::render('Dashboard', [
            'currentPeriod' => $period,
            'totalVentasBs' => $totalVentasBs,
            'totalVentasUsd' => $totalVentasUsd,
            'cantidadVentas' => $cantidadVentas,
            'ventasRecientes' => $ventasRecientes,
            'totalPerdidaBs' => $totalPerdidaBs,
            'totalPerdidaUsd' => $totalPerdidaUsd,
            'metodosPago' => $metodosPago,
            'topProductos' => $topProductos,
            'monthlyHistory' => $monthlyHistory // Pasamos el historial al frontend
        ]);
    }
}