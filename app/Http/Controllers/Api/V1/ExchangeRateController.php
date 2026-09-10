<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExchangeRate\UpdateExchangeConfigRequest;
use App\Http\Resources\ExchangeRateResource;
use App\Services\ExchangeRateService;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;

class ExchangeRateController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ExchangeRateService $exchangeRateService
    ) {}

    public function index(): JsonResponse
    {
        $business = auth()->user()->business;

        $data = $this->exchangeRateService->getDashboardData($business);
        
        return $this->successResponse([
            'current_rate'  => $data['current_rate'] ? new ExchangeRateResource($data['current_rate']) : null,
            'history'       => ExchangeRateResource::collection($data['history']),
            'bcv_mode'      => $data['bcv_mode'],
            'currency_used' => $data['currency_used'],
            'rate_policy'   => $data['rate_policy'],
        ], 'Tasas de cambio obtenidas exitosamente');
    }

    public function sync(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            $rate = $this->exchangeRateService->syncFromBcv($user->id);
            
            return $this->successResponse(
                new ExchangeRateResource($rate),
                'Tasa sincronizada correctamente con el BCV.'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function updateConfig(UpdateExchangeConfigRequest $request): JsonResponse
    {
        try {
            $user = auth()->user();
            
            $this->exchangeRateService->updateConfig(
                business: $user->business,
                bcvMode: $request->validated('bcv_mode'),
                rate: $request->validated('rate'),
                userId: $user->id,
                currencyUsed: $request->validated('currency_used'),
                ratePolicy: $request->validated('rate_policy')
            );
            
            return $this->successResponse(null, 'Configuración de tasa de cambio actualizada exitosamente.');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}