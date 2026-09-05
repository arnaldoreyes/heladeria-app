<?php

namespace App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsFilterRequest;
use App\Services\CustomerSupplierAnalyticsService;
use Illuminate\Http\JsonResponse;

class OperationsAnalyticsController extends Controller
{
    public function __construct(protected CustomerSupplierAnalyticsService $analyticsService) {}

    public function performanceByUser(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getPerformanceByUser(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate()
            )
        ]);
    }
}
