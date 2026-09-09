<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\PaymentMethodBulkDestroyRequest;
use App\Http\Requests\Payment\PaymentMethodBulkStatusUpdateRequest;
use App\Http\Requests\Payment\PaymentMethodRequest;
use App\Http\Resources\PaymentMethodResource;
use App\Models\PaymentMethod;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentMethodController extends Controller
{
    use ApiResponse;

    /**
     * Muestra el listado de métodos de pago con filtros, ordenamiento, relaciones y paginación.
     */
    public function index(Request $request): JsonResponse
    {
        $paymentMethods = QueryBuilder::for(PaymentMethod::class)
            ->allowedFilters(
                AllowedFilter::scope('search'),
                AllowedFilter::exact('currency'),
                AllowedFilter::exact('payment_type_id'),
                AllowedFilter::exact('is_active'),
            )
            ->allowedSorts(
                'name',
                'currency',
                'bank_name',
                'is_active',
            )
            ->defaultSort('name')
            ->allowedIncludes('type')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return $this->successResponse(
            PaymentMethodResource::collection($paymentMethods)->response()->getData(true),
            'Métodos de pago obtenidos exitosamente'
        );
    }

    /**
     * Registra un nuevo método de pago.
     */
    public function store(PaymentMethodRequest $request): JsonResponse
    {
        $paymentMethod = PaymentMethod::create($request->validated());

        return $this->successResponse(
            new PaymentMethodResource($paymentMethod->load('type')),
            'Método de pago creado exitosamente',
            Response::HTTP_CREATED
        );
    }

    /**
     * Muestra el detalle de un método de pago.
     */
    public function show(PaymentMethod $paymentMethod): JsonResponse
    {
        return $this->successResponse(
            new PaymentMethodResource($paymentMethod->load('type')),
            'Detalle del método de pago'
        );
    }

    /**
     * Actualiza un método de pago existente.
     */
    public function update(PaymentMethodRequest $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->update($request->validated());

        return $this->successResponse(
            new PaymentMethodResource($paymentMethod->load('type')),
            'Método de pago actualizado exitosamente'
        );
    }

    /**
     * Elimina un método de pago.
     */
    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->delete();

        return $this->successResponse(
            null,
            'Método de pago eliminado exitosamente'
        );
    }

    /**
     * Alterna el estado activo/inactivo del método de pago.
     */
    public function toggleStatus(PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->update([
            'is_active' => ! $paymentMethod->is_active,
        ]);

        return $this->successResponse(
            new PaymentMethodResource($paymentMethod->load('type')),
            'Estado cambiado exitosamente'
        );
    }

    /**
     * Elimina múltiples métodos de pago de forma masiva.
     */
   public function bulkDestroy(PaymentMethodBulkDestroyRequest $request): JsonResponse
    {
        $deletedCount = PaymentMethod::whereIn('id', $request->validated('ids'))->delete();
        return $this->successResponse(['deleted_count' => $deletedCount], "Se eliminaron {$deletedCount} registros");
    }

    /**
     * Actualiza el estado de múltiples métodos de pago de forma masiva.
     */
    public function bulkStatusUpdate(PaymentMethodBulkStatusUpdateRequest $request): JsonResponse
    {
        $updatedCount = PaymentMethod::whereIn('id', $request->validated('ids'))
            ->update(['is_active' => $request->boolean('is_active')]);

        return $this->successResponse(['updated_count' => $updatedCount], "Se actualizaron {$updatedCount} registros");
    }
}