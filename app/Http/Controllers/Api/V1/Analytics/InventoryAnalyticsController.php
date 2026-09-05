<?php

namespace App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsFilterRequest;
use App\Services\InventoryAnalyticsService;
use Illuminate\Http\JsonResponse;

class InventoryAnalyticsController extends Controller
{
    public function __construct(protected InventoryAnalyticsService $inventoryService) {}

    public function valuation(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->inventoryService->getValuation($request->getBusinessId())
        ]);
    }

    public function lowStockSummary(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->inventoryService->getLowStockSummary($request->getBusinessId())
        ]);
    }

    public function deadStock(AnalyticsFilterRequest $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);

        return response()->json([
            'data' => $this->inventoryService->getDeadStock($request->getBusinessId(), $days)
        ]);
    }

    public function rotationRate(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->inventoryService->getRotationRate(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate()
            )
        ]);
    }

    public function shrinkage(AnalyticsFilterRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->inventoryService->getShrinkage(
                $request->getBusinessId(),
                $request->getStartDate(),
                $request->getEndDate()
            )
        ]);
    }
}
