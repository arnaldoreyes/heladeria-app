<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\BusinessSettingRequest;
use App\Http\Resources\BusinessSettingResource;
use App\Models\BusinessSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessSettingController extends Controller
{
    /**
     * Obtener la configuración del negocio del usuario autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        $businessId = $request->user()->business_id;

        $settings = BusinessSetting::firstOrCreate(
            ['business_id' => $businessId],
            [
                'bcv_mode'                         => 'manual',
                'last_bcv_rate'                    => 0.0000,
                'bcv_manual_rate'                  => 0.0000,
                'default_profit_percentage'        => 30.00,
                'default_reinvestment_percentage'  => 10.00,
                'print_ticket_on_sale'             => true,
            ]
        );

        return response()->json([
            'status' => 'success',
            'data'   => new BusinessSettingResource($settings),
        ]);
    }

    /**
     * Actualizar la configuración del negocio.
     */
    public function update(BusinessSettingRequest $request): JsonResponse
    {
        $businessId = $request->user()->business_id;

        $settings = BusinessSetting::where('business_id', $businessId)->firstOrFail();

        $validated = $request->validated();

        // Si se actualiza la tasa manual en modo 'manual', actualizamos la fecha del BCV y la tasa activa
        if (isset($validated['bcv_manual_rate']) && ($validated['bcv_mode'] ?? $settings->bcv_mode) === 'manual') {
            $validated['last_bcv_rate'] = $validated['bcv_manual_rate'];
            $validated['bcv_last_updated_at'] = now();
        }

        $settings->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Configuración actualizada correctamente.',
            'data'    => new BusinessSettingResource($settings->fresh()),
        ]);
    }

    /**
     * Actualizar manualmente la tasa BCV activa del negocio (Endpoint rápido).
     */
    public function updateExchangeRate(Request $request): JsonResponse
    {
        $businessId = $request->user()->business_id;

        $validated = $request->validate([
            'rate' => ['required', 'numeric', 'gt:0'],
        ]);

        $settings = BusinessSetting::where('business_id', $businessId)->firstOrFail();

        $settings->update([
            'bcv_manual_rate'     => $validated['rate'],
            'last_bcv_rate'       => $validated['rate'],
            'bcv_last_updated_at' => now(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Tasa de cambio actualizada exitosamente.',
            'data'    => new BusinessSettingResource($settings->fresh()),
        ]);
    }
}
