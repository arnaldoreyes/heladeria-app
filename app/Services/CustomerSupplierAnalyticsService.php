<?php

namespace App\Services;

use App\Models\Restock;
use App\Models\RestockItem;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CustomerSupplierAnalyticsService
{
    /**
     * Calcula métricas RFM (Recencia, Frecuencia, Monto) para los clientes en un rango de fechas.
     */
    public function getRetentionRfm(string $businessId, Carbon $startDate, Carbon $endDate): Collection
    {
        return DB::table('sales')
            ->where('business_id', $businessId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNull('deleted_at')
            ->select(
                'customer_id',
                DB::raw('MAX(created_at) as last_purchase_date'),
                DB::raw('COUNT(id) as total_orders'),
                DB::raw('COALESCE(SUM(total_usd), 0) as total_spent')
            )
            ->groupBy('customer_id')
            ->get()
            ->map(function ($row) use ($endDate) {
                $lastPurchase = Carbon::parse($row->last_purchase_date);

                return [
                    'customer_id' => $row->customer_id,
                    'recency_days' => (int) $lastPurchase->diffInDays($endDate),
                    'frequency' => (int) $row->total_orders,
                    'monetary_value' => (float) $row->total_spent,
                ];
            });
    }

    public function getTopBuyers(string $businessId, Carbon $startDate, Carbon $endDate, int $limit = 10): array
    {
        return Sale::where('sales.business_id', $businessId)
            ->join('customers', 'customers.id', '=', 'sales.customer_id')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select(
                'customers.id',
                'customers.name',
                'customers.email',
                DB::raw('COUNT(sales.id) as total_orders'),
                DB::raw('COALESCE(SUM(sales.total_usd), 0) as total_spent_usd')
            )
            ->groupBy('customers.id', 'customers.name', 'customers.email')
            ->orderByDesc('total_spent_usd')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getAccountsReceivable(string $businessId): array
    {
        return Sale::where('business_id', $businessId)
            ->where('status', 'completed')
            ->where('pending_usd', '>', 0)
            ->with(['customer:id,name,phone'])
            ->select('id', 'customer_id', 'total_usd', 'paid_usd', 'pending_usd', 'created_at')
            ->orderByDesc('pending_usd')
            ->get()
            ->toArray();
    }

    public function getRestockSummary(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        return Restock::where('business_id', $businessId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                COUNT(*) as total_restocks,
                COALESCE(SUM(total_usd), 0) as total_spent_usd,
                COALESCE(SUM(total_bs), 0) as total_spent_bs
            ')
            ->first()
            ?->toArray() ?? [];
    }

    public function getCostTrends(string $businessId, int $limit = 20): array
    {
        return RestockItem::where('restock_items.business_id', $businessId)
            ->join('products', 'products.id', '=', 'restock_items.product_id')
            ->select(
                'products.name as product_name',
                'restock_items.unit_cost_usd',
                'restock_items.unit_cost_bs',
                'restock_items.created_at'
            )
            ->orderBy('restock_items.created_at', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getPerformanceByUser(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        return Sale::where('sales.business_id', $businessId)
            ->join('users', 'users.id', '=', 'sales.user_id')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select(
                'users.id as user_id',
                'users.name as user_name',
                DB::raw('COUNT(sales.id) as sales_count'),
                DB::raw('COALESCE(SUM(sales.total_usd), 0) as total_usd'),
                DB::raw('COALESCE(SUM(sales.profit_usd), 0) as total_profit_usd')
            )
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_usd')
            ->get()
            ->toArray();
    }
}
