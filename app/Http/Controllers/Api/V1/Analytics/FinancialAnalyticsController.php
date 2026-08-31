<?php

namespacesuperadmin App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsFilterRequest;
use App\Services\FinancialAnalyticsService;
use Illuminate\Http\JsonResponse;

class FinancialAnalyticsController extends Controller
{
    public function __construct(
        protected FinancialAnalyticsService $financialService
    ) {}

    public function profitLoss(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->financialService->getProfitAndLoss(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate()
            )
        ]);
    }

    public function reinvestmentFund(AnalyticsFilterRequest $request): JsonResponse
    {
        $pnl = $this->financialService->getProfitAndLoss(
            $request->getBusinessId(),
            $request->getStartDate(),
            $request->getEndDate()
        );

        return response()->json([
            'data' => [
                'reinvestment_fund_usd' => $pnl['reinvestment_fund_accumulated_usd']
            ]
        ]);
    }

    public function expensesBreakdown(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->financialService->getExpensesBreakdown(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate()
            )
        ]);
    }

    public function currencyBalance(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->financialService->getCurrencyBalance($request->getBusinessId())
        ]);
    }
}
