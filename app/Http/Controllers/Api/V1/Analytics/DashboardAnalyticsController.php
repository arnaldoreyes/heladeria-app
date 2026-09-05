<?php

namespace App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsFilterRequest;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;

class DashboardAnalyticsController extends Controller
{
    public function __invoke(AnalyticsFilterRequest $request, AnalyticsService $analyticsService): JsonResponse
    {
        $data = $analyticsService->getDashboardSummary(
            $request->getBusinessId(),
            $request->getStartDate(),
            $request->getEndDate()
        );

        return response()->json(['data' => $data]);
    }
}
