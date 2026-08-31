<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Restock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getDashboardSummary(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        // Una sola consulta consolidada para obtener métricas de ventas
        $salesSummary = Sale::where('business_id', $businessId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                COALESCE(SUM(total_usd), 0) as total_sales_usd,
                COALESCE(SUM(total_bs), 0) as total_sales_bs,
                COALESCE(SUM(profit_usd), 0) as total_profit_usd,
                COUNT(*) as total_orders
            ')
            ->first();

        $totalSalesUsd = (float) $salesSummary->total_sales_usd;
        $totalSalesBs = (float) $salesSummary->total_sales_bs;
        $totalProfitUsd = (float) $salesSummary->total_profit_usd;
        $totalOrders = (int) $salesSummary->total_orders;

        $inventoryValue = Product::where('business_id', $businessId)
            ->selectRaw('
                COALESCE(SUM(stock * cost_usd), 0) as total_usd,
                COALESCE(SUM(stock * cost_bs), 0) as total_bs
            ')
            ->first();

        $lowStockCount = Product::where('business_id', $businessId)
            ->whereColumn('stock', '<=', 'min_stock')
            ->count();

        return [
            'sales' => [
                'total_usd' => round($totalSalesUsd, 2),
                'total_bs' => round($totalSalesBs, 2),
                'total_profit_usd' => round($totalProfitUsd, 2),
                'total_orders' => $totalOrders,
                'average_ticket_usd' => $totalOrders > 0 ? round($totalSalesUsd / $totalOrders, 2) : 0,
            ],
            'inventory' => [
                'valuation_usd' => round((float) $inventoryValue->total_usd, 2),
                'valuation_bs' => round((float) $inventoryValue->total_bs, 2),
                'low_stock_products' => $lowStockCount,
            ],
        ];
    }

    public function getSalesSummary(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        return Sale::where('business_id', $businessId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                COUNT(*) as total_sales,
                COALESCE(SUM(total_usd), 0) as total_usd,
                COALESCE(SUM(total_bs), 0) as total_bs,
                COALESCE(SUM(cost_usd), 0) as total_cost_usd,
                COALESCE(SUM(margin_usd), 0) as total_margin_usd,
                COALESCE(SUM(profit_usd), 0) as total_profit_usd,
                COALESCE(SUM(reinvestment_usd), 0) as total_reinvestment_usd,
                COALESCE(SUM(paid_usd), 0) as total_paid_usd,
                COALESCE(SUM(pending_usd), 0) as total_pending_usd
            ')
            ->first()
            ?->toArray() ?? [];
    }

    public function getTopProducts(string $businessId, Carbon $startDate, Carbon $endDate, int $limit = 10): array
    {
        return SaleItem::where('sale_items.business_id', $businessId)
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select(
                'sale_items.product_id',
                'sale_items.product_name_snapshot as product_name',
                DB::raw('SUM(sale_items.quantity) as total_quantity_sold'),
                DB::raw('SUM(sale_items.subtotal_usd) as total_revenue_usd'),
                DB::raw('SUM(sale_items.profit_usd) as total_profit_usd')
            )
            ->groupBy('sale_items.product_id', 'sale_items.product_name_snapshot')
            ->orderByDesc('total_quantity_sold')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getSalesByPaymentMethod(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        return SalePayment::where('sale_payments.business_id', $businessId)
            ->join('sales', 'sales.id', '=', 'sale_payments.sale_id')
            ->join('payment_methods', 'payment_methods.id', '=', 'sale_payments.payment_method_id')
            ->where('sales.status', 'completed')
            ->whereBetween('sale_payments.created_at', [$startDate, $endDate])
            ->select(
                'payment_methods.name as payment_method',
                'sale_payments.currency',
                DB::raw('SUM(sale_payments.amount_original) as total_original'),
                DB::raw('SUM(sale_payments.amount_usd) as total_usd'),
                DB::raw('COUNT(sale_payments.id) as transaction_count')
            )
            ->groupBy('payment_methods.name', 'sale_payments.currency')
            ->get()
            ->toArray();
    }

    public function getHourlyTraffic(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        return Sale::where('business_id', $businessId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as total_sales'),
                DB::raw('SUM(total_usd) as total_usd')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->toArray();
    }

    public function getSalesByCategory(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        return SaleItem::where('sale_items.business_id', $businessId)
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select(
                DB::raw("COALESCE(categories.name, 'Sin Categoría') as category_name"),
                DB::raw('SUM(sale_items.quantity) as total_quantity_sold'),
                DB::raw('SUM(sale_items.subtotal_usd) as total_usd'),
                DB::raw('SUM(sale_items.profit_usd) as profit_usd')
            )
            ->groupBy('category_name')
            ->orderByDesc('total_usd')
            ->get()
            ->toArray();
    }
}
