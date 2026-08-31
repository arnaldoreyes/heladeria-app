<?php

namespacesuperadmin App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsFilterRequest;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;

class SalesAnalyticsController extends Controller
{
    public function __construct(protected AnalyticsService $analyticsService) {}

    public function summary(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getSalesSummary(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate()
            )
        ]);
    }

    public function topProducts(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getTopProducts(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate(),
                (int) $request->input('limit', 10)
            )
        ]);
    }

    public function byPaymentMethod(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getSalesByPaymentMethod(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate()
            )
        ]);
    }

    public function hourlyTraffic(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getHourlyTraffic(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate()
            )
        ]);
    }

    public function byCategory(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getSalesByCategory(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate()
            )
        ]);
    }
}
