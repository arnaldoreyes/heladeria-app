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
        // 1. Resumen Global (Delegado a SQL puro, instantáneo <5ms)
        $globalSalesCount = Sale::count();
        $globalGross = (float) Sale::sum('total_usd');

        $globalStats = [
            'total_gross' => $globalGross,
            'total_cost' => (float) Sale::sum('cost_usd'),
            'total_margin' => (float) Sale::sum('margin_usd'),
            'total_reinvestment' => (float) Sale::sum('reinvestment_usd'),
            'total_profit' => (float) Sale::sum('profit_usd'),
            'total_loss' => (float) Sale::where('tasa_bcv', '>', 0)->sum(DB::raw('change_loss_bs / tasa_bcv')),
            'total_restock' => (float) Restock::sum('total_usd'),
            'average_ticket' => $globalSalesCount > 0 ? ($globalGross / $globalSalesCount) : 0,
        ];

        // Top 5 Productos optimizado por SQL
        $topProducts = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(sale_items.quantity) as total_vendido'))
            ->groupBy('products.name')
            ->orderByDesc('total_vendido')
            ->take(5)
            ->pluck('total_vendido', 'name')
            ->toArray();

        // Horas y Días pico calculados directamente por SQL
        $peakHourRow = Sale::select(DB::raw("HOUR(created_at) as h"), DB::raw("SUM(total_usd) as total"))
            ->groupBy('h')->orderByDesc('total')->first();
        $peakHour = $peakHourRow ? str_pad($peakHourRow->h, 2, '0', STR_PAD_LEFT) . ':00' : 'N/A';

        $bestDayRow = Sale::select(DB::raw("DAYOFWEEK(created_at) as d"), DB::raw("SUM(total_usd) as total"))
            ->groupBy('d')->orderByDesc('total')->first();
        $daysMap = [1 => 'Domingo', 2 => 'Lunes', 3 => 'Martes', 4 => 'Miércoles', 5 => 'Jueves', 6 => 'Viernes', 7 => 'Sábado'];
        $bestDay = $bestDayRow && isset($daysMap[$bestDayRow->d]) ? $daysMap[$bestDayRow->d] : 'N/A';

        // 2. CONSOLIDADO MENSUAL (Agrupado directo en SQL)
        $monthlySalesGroup = Sale::select(
            DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month_key"),
            DB::raw("COUNT(*) as sales_count"),
            DB::raw("COALESCE(SUM(total_usd), 0) as total_sales_usd"),
            DB::raw("COALESCE(SUM(cost_usd), 0) as total_cost_usd"),
            DB::raw("COALESCE(SUM(margin_usd), 0) as total_margin_usd"),
            DB::raw("COALESCE(SUM(reinvestment_usd), 0) as reinvestment_usd"),
            DB::raw("COALESCE(SUM(profit_usd), 0) as profit_usd"),
            DB::raw("COALESCE(SUM(CASE WHEN tasa_bcv > 0 THEN change_loss_bs / tasa_bcv ELSE 0 END), 0) as total_loss_usd")
        )
        ->groupBy('month_key')
        ->get()
        ->keyBy('month_key');

        $monthlyRestocksGroup = Restock::select(
            DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month_key"),
            DB::raw("COUNT(*) as restock_count"),
            DB::raw("COALESCE(SUM(total_usd), 0) as total_restock_usd")
        )
        ->groupBy('month_key')
        ->get()
        ->keyBy('month_key');

        $allMonths = $monthlySalesGroup->keys()->merge($monthlyRestocksGroup->keys())->unique()->sortDesc();
        $history = [];

        foreach ($allMonths as $monthKey) {
            $mSalesData = $monthlySalesGroup->get($monthKey);
            $mRestockData = $monthlyRestocksGroup->get($monthKey);

            $date = Carbon::createFromFormat('Y-m', $monthKey)->locale('es');
            $mTotalSales = (float) ($mSalesData->total_sales_usd ?? 0);
            $mTotalLoss = (float) ($mSalesData->total_loss_usd ?? 0);
            $mSalesCount = (int) ($mSalesData->sales_count ?? 0);

            // Volumen semanal por unidades vendidas (Solo productos con >0 unidades)
            $weeklyVolumeQuery = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->select(
                    DB::raw("WEEK(sales.created_at, 1) - WEEK(DATE_SUB(sales.created_at, INTERVAL DAYOFMONTH(sales.created_at)-1 DAY), 1) + 1 as week_num"),
                    'products.name as product_name',
                    DB::raw('SUM(sale_items.quantity) as total_units')
                )
                ->whereRaw("DATE_FORMAT(sales.created_at, '%Y-%m') = ?", [$monthKey])
                ->groupBy('week_num', 'products.name')
                ->having('total_units', '>', 0)
                ->orderBy('week_num')
                ->orderByDesc('total_units')
                ->get();

            $weeklyVolume = [];
            foreach ($weeklyVolumeQuery as $row) {
                $wKey = 'Semana ' . $row->week_num;
                if (!isset($weeklyVolume[$wKey])) {
                    $weeklyVolume[$wKey] = [];
                }
                $weeklyVolume[$wKey][] = [
                    'product_name' => $row->product_name,
                    'total_units' => (int) $row->total_units,
                ];
            }

            $history[] = [
                'id' => $monthKey,
                'month_name' => ucfirst($date->translatedFormat('F Y')),
                'total_sales_usd' => $mTotalSales,
                'total_cost_usd' => (float) ($mSalesData->total_cost_usd ?? 0),
                'total_margin_usd' => (float) ($mSalesData->total_margin_usd ?? 0),
                'reinvestment_usd' => (float) ($mSalesData->reinvestment_usd ?? 0),
                'profit_usd' => (float) ($mSalesData->profit_usd ?? 0),
                'total_loss_usd' => $mTotalLoss,
                'sales_count' => $mSalesCount,
                'average_ticket' => $mSalesCount > 0 ? ($mTotalSales / $mSalesCount) : 0,
                'loss_percentage' => $mTotalSales > 0 ? (($mTotalLoss / $mTotalSales) * 100) : 0,
                'total_restock_usd' => (float) ($mRestockData->total_restock_usd ?? 0),
                'restock_count' => (int) ($mRestockData->restock_count ?? 0),
                'sales' => Sale::with('items.product')->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$monthKey])->latest()->get(),
                'restocks' => Restock::with('items.product')->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$monthKey])->latest()->get(),
                'weekly_volume' => $weeklyVolume,
            ];
        }

        // 3. VOLUMEN DE LA SEMANA ACTUAL (Semana corriendo)
        $now = Carbon::now('America/Caracas');
        $currentMonthName = ucfirst($now->locale('es')->translatedFormat('F Y'));
        $currentWeekNumRow = DB::selectOne("SELECT WEEK(NOW(), 1) - WEEK(DATE_SUB(NOW(), INTERVAL DAYOFMONTH(NOW())-1 DAY), 1) + 1 as wnum");
        $currentWeekNum = $currentWeekNumRow ? (int)$currentWeekNumRow->wnum : 1;
        $currentWeekLabel = "{$currentMonthName} - Semana {$currentWeekNum}";

        $currentWeekProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select('products.name as product_name', DB::raw('SUM(sale_items.quantity) as total_units'))
            ->whereRaw("DATE_FORMAT(sales.created_at, '%Y-%m') = ?", [$now->format('Y-m')])
            ->whereRaw("(WEEK(sales.created_at, 1) - WEEK(DATE_SUB(sales.created_at, INTERVAL DAYOFMONTH(sales.created_at)-1 DAY), 1) + 1) = ?", [$currentWeekNum])
            ->groupBy('products.name')
            ->having('total_units', '>', 0)
            ->orderByDesc('total_units')
            ->get();

        return Inertia::render('Finances/Index', [
            'global_stats' => $globalStats,
            'analytics' => [
                'peak_hour' => $peakHour,
                'best_day' => $bestDay,
                'top_products' => $topProducts,
            ],
            'current_week_volume' => [
                'label' => $currentWeekLabel,
                'products' => $currentWeekProducts,
            ],
            'history' => $history
        ]);
    }
}