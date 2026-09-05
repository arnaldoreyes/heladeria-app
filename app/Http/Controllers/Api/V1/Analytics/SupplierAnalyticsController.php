<?php

namespace App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsFilterRequest;
use App\Services\CustomerSupplierAnalyticsService;
use Illuminate\Http\JsonResponse;

class SupplierAnalyticsController extends Controller
{
    public function __construct(protected CustomerSupplierAnalyticsService $analyticsService) {}

    public function restockSummary(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getRestockSummary(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate()
            )
        ]);
    }

    public function costTrends(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getCostTrends(
                $request->getBusinessId(),
                (int) $request->input('limit', 20)
            )
        ]);
    }
}
