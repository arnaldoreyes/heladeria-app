<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentTypeRequest;
use App\Http\Resources\PaymentTypeResource;
use App\Models\PaymentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentTypeController extends Controller
{
    /**
     * Lista los tipos de pago configurados con filtros, ordenamiento, relaciones y paginación.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $paymentTypes = QueryBuilder::for(PaymentType::class)
            ->allowedFilters(
                // Búsqueda global por nombre o código
                AllowedFilter::scope('search'),

                // Filtros exactos
                AllowedFilter::exact('code'),
                AllowedFilter::exact('requires_reference'),
                AllowedFilter::exact('is_active'),
            )
            ->allowedSorts(
                'name',
                'code',
                'requires_reference',
                'is_active',
                'created_at',
            )
            ->defaultSort('name')
            ->allowedIncludes(
                'methods',
            )
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return PaymentTypeResource::collection($paymentTypes);
    }

    /**
     * Crea un nuevo tipo de pago.
     */
    public function store(PaymentTypeRequest $request): JsonResponse
    {
        $paymentType = PaymentType::create($request->validated());

        return (new PaymentTypeResource($paymentType))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Muestra el detalle de un tipo de pago.
     */
    public function show(PaymentType $paymentType): PaymentTypeResource
    {
        return new PaymentTypeResource($paymentType->load(['methods']));
    }

    /**
     * Actualiza un tipo de pago existente.
     */
    public function update(PaymentTypeRequest $request, PaymentType $paymentType): PaymentTypeResource
    {
        $paymentType->update($request->validated());

        return new PaymentTypeResource($paymentType->load(['methods']));
    }

    /**
     * Elimina un tipo de pago si no tiene métodos asociados.
     */
    public function destroy(PaymentType $paymentType): JsonResponse
    {
        if ($paymentType->methods()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar el tipo de pago porque tiene métodos/cuentas de pago asociados.'
            ], 422);
        }

        $paymentType->delete();

        return response()->json(null, 204);
    }

    /**
     * Alterna el estado activo/inactivo del tipo de pago.
     */
    public function toggleStatus(PaymentType $paymentType): PaymentTypeResource
    {
        $paymentType->update([
            'is_active' => ! $paymentType->is_active,
        ]);

        return new PaymentTypeResource($paymentType);
    }
}
