<?php
namespace App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsFilterRequest;
use App\Services\CustomerSupplierAnalyticsService;
use Illuminate\Http\JsonResponse;

class CustomerAnalyticsController extends Controller
{
    public function __construct(
        protected CustomerSupplierAnalyticsService $analyticsService
    ) {}

    /**
     * Obtiene los clientes con mayor volumen de compras en el período especificado.
     */
    public function topBuyers(AnalyticsFilterRequest $request): JsonResponse
    {
        $topBuyers = $this->analyticsService->getTopBuyers(
            $request->getBusinessId(),
            $request->getStartDate(),
            $request->getEndDate(),
            (int) $request->input('limit', 10)
        );

        return response()->json([
            'data' => $topBuyers,
        ]);
    }

    /**
     * Obtiene métricas de retención y análisis RFM (Recencia, Frecuencia, Monto) de clientes.
     */
    public function retentionRfm(AnalyticsFilterRequest $request): JsonResponse
    {
        $rfmMetrics = $this->analyticsService->getRetentionRfm(
            $request->getBusinessId(),
            $request->getStartDate(),
            $request->getEndDate()
        );

        return response()->json([
            'data' => $rfmMetrics,
        ]);
    }

    /**
     * Obtiene el resumen consolidado de cuentas por cobrar (créditos pendientes por cliente).
     */
    public function accountsReceivable(AnalyticsFilterRequest $request): JsonResponse
    {
        $accountsReceivable = $this->analyticsService->getAccountsReceivable(
            $request->getBusinessId()
        );

        return response()->json([
            'data' => $accountsReceivable,
        ]);
    }
}
