<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Restock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class FinanceController extends Controller
{
    public function index()
    {
        // Nota: Si la base de datos crece mucho, considera usar DB::raw y agrupar por SQL 
        // en lugar de cargar todo en memoria con get(), pero para el volumen actual esto funciona.
        $allSales = Sale::with('items.product')->get();
        $allRestocks = Restock::all();

        // 1. Resumen Global (Delegado a SQL)
        $globalGross = (float) Sale::sum('total_usd');
        $globalCost = (float) Sale::sum('cost_usd');
        $globalMargin = (float) Sale::sum('margin_usd');
        $globalReinvestment = (float) Sale::sum('reinvestment_usd');
        $globalProfit = (float) Sale::sum('profit_usd');
        $globalLoss = (float) Sale::where('tasa_bcv', '>', 0)->sum(DB::raw('change_loss_bs / tasa_bcv'));
        $globalSalesCount = Sale::count();
        $globalRestock = (float) Restock::sum('total_usd');

        // Top 5 Productos optimizado por SQL
        $topProducts = \Illuminate\Support\Facades\DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select('products.name', \Illuminate\Support\Facades\DB::raw('SUM(sale_items.quantity) as total_vendido'))
            ->groupBy('products.name')
            ->orderByDesc('total_vendido')
            ->take(5)
            ->pluck('total_vendido', 'name')
            ->toArray();

        // Mejores Tiempos (Usando la colección ya cargada)
        $salesByHour = $allSales->groupBy(function ($sale) { return \Carbon\Carbon::parse($sale->created_at)->hour; })
                                ->map(function ($group) { return $group->sum('total_usd'); });
        $peakHour = $salesByHour->isNotEmpty() ? str_pad($salesByHour->sortDesc()->keys()->first(), 2, '0', STR_PAD_LEFT) . ':00' : 'N/A';

        $salesByDay = $allSales->groupBy(function ($sale) { return \Carbon\Carbon::parse($sale->created_at)->dayOfWeek; })
                               ->map(function ($group) { return $group->sum('total_usd'); });
        $daysMap = [0 => 'Domingo', 1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado'];
        $bestDay = $salesByDay->isNotEmpty() ? $daysMap[$salesByDay->sortDesc()->keys()->first()] : 'N/A';

        // 2. CONSOLIDADO MENSUAL (Histórico)
        $monthlySales = $allSales->groupBy(function($sale) { return Carbon::parse($sale->created_at)->format('Y-m'); });
        $monthlyRestocks = $allRestocks->groupBy(function($res) { return Carbon::parse($res->created_at)->format('Y-m'); });

        $allMonths = $monthlySales->keys()->merge($monthlyRestocks->keys())->unique()->sortDesc();
        $history = [];

        foreach ($allMonths as $monthKey) {
            $mSales = $monthlySales->get($monthKey, collect());
            $mRestocks = $monthlyRestocks->get($monthKey, collect());

            $salesByWeek = [];
            foreach($mSales as $s) {
                $week = Carbon::parse($s->created_at)->weekOfMonth;
                if(!isset($salesByWeek[$week])) $salesByWeek[$week] = 0;
                $salesByWeek[$week] += $s->total_usd;
            }
            $bestWeek = !empty($salesByWeek) ? array_search(max($salesByWeek), $salesByWeek) : null;

            $date = Carbon::createFromFormat('Y-m', $monthKey)->locale('es');
            
            $mTotalSales = (float) $mSales->sum('total_usd');
            $mTotalCost = (float) $mSales->sum('cost_usd');
            $mTotalMargin = (float) $mSales->sum('margin_usd');
            $mTotalReinvestment = (float) $mSales->sum('reinvestment_usd');
            $mTotalProfit = (float) $mSales->sum('profit_usd');

            $mTotalLoss = (float) $mSales->sum(function($s) {
                return $s->tasa_bcv > 0 ? ($s->change_loss_bs / $s->tasa_bcv) : 0;
            });
            $mSalesCount = $mSales->count();

            $history[] = [
                'id' => $monthKey,
                'month_name' => ucfirst($date->translatedFormat('F Y')),
                'total_sales_usd' => $mTotalSales,
                'total_cost_usd' => $mTotalCost,
                'total_margin_usd' => $mTotalMargin,
                'reinvestment_usd' => $mTotalReinvestment,
                'profit_usd' => $mTotalProfit,
                'total_loss_usd' => $mTotalLoss,
                'sales_count' => $mSalesCount,
                // Ticket Promedio y Porcentaje de Fuga
                'average_ticket' => $mSalesCount > 0 ? ($mTotalSales / $mSalesCount) : 0,
                'loss_percentage' => $mTotalSales > 0 ? (($mTotalLoss / $mTotalSales) * 100) : 0,
                'best_week' => $bestWeek ? "Semana $bestWeek" : 'N/A',
                'total_restock_usd' => (float) $mRestocks->sum('total_usd'),
                'restock_count' => $mRestocks->count(),
                'sales' => $mSales->sortByDesc('created_at')->values(),
            ];
        }

        return Inertia::render('Finances/Index', [
            'global_stats' => [
                'total_gross' => $globalGross,
                'total_cost' => $globalCost,
                'total_margin' => $globalMargin,
                'total_reinvestment' => $globalReinvestment,
                'total_profit' => $globalProfit,
                'total_loss' => $globalLoss,
                'total_restock' => $globalRestock,
                'average_ticket' => $globalSalesCount > 0 ? ($globalGross / $globalSalesCount) : 0,
            ],
            'analytics' => [
                'peak_hour' => $peakHour,
                'best_day' => $bestDay,
                'top_products' => $topProducts,
            ],
            'history' => $history
        ]);
    }
}