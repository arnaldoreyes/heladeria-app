<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InventoryAnalyticsService
{
    public function getValuation(string $businessId): array
    {
        return Product::where('business_id', $businessId)
            ->selectRaw('
                COUNT(*) as total_products,
                COALESCE(SUM(stock), 0) as total_items,
                COALESCE(SUM(stock * cost_usd), 0) as total_cost_usd,
                COALESCE(SUM(stock * price_usd), 0) as total_retail_value_usd,
                COALESCE(SUM(stock * (price_usd - cost_usd)), 0) as potential_profit_usd
            ')
            ->first()
            ?->toArray() ?? [];
    }

    public function getLowStockSummary(string $businessId): array
    {
        return Product::where('business_id', $businessId)
            ->whereColumn('stock', '<=', 'min_stock')
            ->select('id', 'name', 'sku', 'stock', 'min_stock', 'cost_usd')
            ->orderBy('stock', 'asc')
            ->get()
            ->toArray();
    }

    public function getDeadStock(string $businessId, int $daysThreshold = 30): array
    {
        $cutoffDate = now()->subDays($daysThreshold);

        return Product::where('business_id', $businessId)
            ->where('stock', '>', 0)
            ->whereNotIn('id', function ($query) use ($businessId, $cutoffDate) {
                $query->select('product_id')
                    ->from('sale_items')
                    ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
                    ->where('sales.business_id', $businessId)
                    ->where('sales.status', 'completed')
                    ->where('sales.created_at', '>=', $cutoffDate);
            })
            ->select(
                'id',
                'name',
                'sku',
                'stock',
                'cost_usd',
                DB::raw('(stock * cost_usd) as locked_capital_usd'),
                'updated_at'
            )
            ->orderByDesc('locked_capital_usd')
            ->get()
            ->toArray();
    }

    public function getRotationRate(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        return InventoryMovement::where('business_id', $businessId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select('type', DB::raw('COALESCE(SUM(quantity), 0) as total_quantity'))
            ->groupBy('type')
            ->get()
            ->pluck('total_quantity', 'type')
            ->toArray();
    }

    public function getShrinkage(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        return InventoryMovement::where('inventory_movements.business_id', $businessId)
            ->whereIn('inventory_movements.type', ['adjustment_out', 'damage', 'loss', 'expired'])
            ->whereBetween('inventory_movements.created_at', [$startDate, $endDate])
            ->join('products', 'products.id', '=', 'inventory_movements.product_id')
            ->select(
                'inventory_movements.type',
                DB::raw('COALESCE(SUM(inventory_movements.quantity), 0) as total_units'),
                DB::raw('COALESCE(SUM(inventory_movements.quantity * products.cost_usd), 0) as total_loss_usd')
            )
            ->groupBy('inventory_movements.type')
            ->get()
            ->toArray();
    }
}
