<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Restock;
use Illuminate\Http\Request;
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

        $salesByDay = array_fill(0, 7, 0); 
        $salesByHour = array_fill(0, 24, 0);
        $productsCount = [];

        // Variables para Resumen Global
        $globalGross = 0;
        $globalLoss = 0;
        $globalSalesCount = $allSales->count();

        foreach ($allSales as $sale) {
            $date = Carbon::parse($sale->created_at);
            $salesByDay[$date->dayOfWeek] += $sale->total_usd;
            $salesByHour[$date->hour] += $sale->total_usd;

            $globalGross += $sale->total_usd;
            // Evitar división por cero
            $loss = ($sale->tasa_bcv > 0) ? ($sale->change_loss_bs / $sale->tasa_bcv) : 0;
            $globalLoss += $loss;

            foreach ($sale->items as $item) {
                $prodName = $item->product ? $item->product->name : 'Eliminado';
                if (!isset($productsCount[$prodName])) $productsCount[$prodName] = 0;
                $productsCount[$prodName] += $item->quantity;
            }
        }

        $globalRestock = $allRestocks->sum('total_usd');

        // Mejores Tiempos
        $peakHourIndex = !empty(array_filter($salesByHour)) ? array_search(max($salesByHour), $salesByHour) : null;
        $peakHour = $peakHourIndex !== null ? str_pad($peakHourIndex, 2, '0', STR_PAD_LEFT) . ':00' : 'N/A';

        $bestDayIndex = !empty(array_filter($salesByDay)) ? array_search(max($salesByDay), $salesByDay) : null;
        $daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        $bestDay = $bestDayIndex !== null ? $daysMap[$bestDayIndex] : 'N/A';

        // Top Productos
        arsort($productsCount);
        $topProducts = array_slice($productsCount, 0, 5, true);

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
            $mTotalLoss = (float) $mSales->sum(function($s) {
                return $s->tasa_bcv > 0 ? ($s->change_loss_bs / $s->tasa_bcv) : 0;
            });
            $mSalesCount = $mSales->count();

            $history[] = [
                'id' => $monthKey,
                'month_name' => ucfirst($date->translatedFormat('F Y')),
                'total_sales_usd' => $mTotalSales,
                'total_loss_usd' => $mTotalLoss,
                'sales_count' => $mSalesCount,
                // NUEVO: Ticket Promedio y Porcentaje de Fuga
                'average_ticket' => $mSalesCount > 0 ? ($mTotalSales / $mSalesCount) : 0,
                'loss_percentage' => $mTotalSales > 0 ? (($mTotalLoss / $mTotalSales) * 100) : 0,
                'best_week' => $bestWeek ? "Semana $bestWeek" : 'N/A',
                'total_restock_usd' => (float) $mRestocks->sum('total_usd'),
                'restock_count' => $mRestocks->count(),
            ];
        }

        return Inertia::render('Finances/Index', [
            'global_stats' => [
                'total_gross' => $globalGross,
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