<?php
namespace App\Services;

use App\Models\Expense;
use App\Models\Sale;
use App\Models\SalePayment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinancialAnalyticsService
{
    public function getProfitAndLoss(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        $salesMetrics = Sale::where('business_id', $businessId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                COALESCE(SUM(total_usd), 0) as gross_revenue_usd,
                COALESCE(SUM(cost_usd), 0) as total_cogs_usd,
                COALESCE(SUM(margin_usd), 0) as gross_margin_usd,
                COALESCE(SUM(profit_usd), 0) as net_profit_usd,
                COALESCE(SUM(reinvestment_usd), 0) as reinvestment_fund_usd
            ')
            ->first();

        $totalExpensesUsd = (float) Expense::where('business_id', $businessId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount_usd');

        $grossMarginUsd = (float) $salesMetrics->gross_margin_usd;

        return [
            'gross_revenue_usd' => round((float) $salesMetrics->gross_revenue_usd, 2),
            'cost_of_goods_sold_usd' => round((float) $salesMetrics->total_cogs_usd, 2),
            'gross_margin_usd' => round($grossMarginUsd, 2),
            'operating_expenses_usd' => round($totalExpensesUsd, 2),
            'net_operating_profit_usd' => round($grossMarginUsd - $totalExpensesUsd, 2),
            'reinvestment_fund_accumulated_usd' => round((float) $salesMetrics->reinvestment_fund_usd, 2),
        ];
    }

    public function getExpensesBreakdown(string $businessId, Carbon $startDate, Carbon $endDate): array
    {
        return Expense::where('expenses.business_id', $businessId)
            ->leftJoin('expense_categories', 'expense_categories.id', '=', 'expenses.expense_category_id')
            ->whereBetween('expenses.created_at', [$startDate, $endDate])
            ->select(
                DB::raw("COALESCE(expense_categories.name, 'Sin Categoría') as category_name"),
                DB::raw('COALESCE(SUM(expenses.amount_usd), 0) as total_usd'),
                DB::raw('COUNT(expenses.id) as expense_count')
            )
            ->groupBy('category_name')
            ->orderByDesc('total_usd')
            ->get()
            ->toArray();
    }

    public function getCurrencyBalance(string $businessId): array
    {
        return SalePayment::where('business_id', $businessId)
            ->select(
                'currency',
                DB::raw('COALESCE(SUM(amount_original), 0) as total_original'),
                DB::raw('COALESCE(SUM(amount_usd), 0) as total_usd')
            )
            ->groupBy('currency')
            ->get()
            ->toArray();
    }
}
