<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentMethodRequest;
use App\Http\Resources\PaymentMethodResource;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentMethodController extends Controller
{
    /**
     * Muestra el listado de métodos de pago con filtros, ordenamiento, relaciones y paginación.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $paymentMethods = QueryBuilder::for(PaymentMethod::class)
            ->allowedFilters(
                // Búsqueda global en nombre, banco, documento, teléfono o email
                AllowedFilter::scope('search'),

                // Filtros exactos
                AllowedFilter::exact('currency'),
                AllowedFilter::exact('payment_type_id'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('bank_name'),
            )
            ->allowedSorts(
                'name',
                'currency',
                'bank_name',
                'is_active',
                'created_at',
            )
            ->defaultSort('name')
            ->allowedIncludes(
                'type',
            )
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return PaymentMethodResource::collection($paymentMethods);
    }

    /**
     * Registra un nuevo método de pago / cuenta.
     */
    public function store(PaymentMethodRequest $request): JsonResponse
    {
        $paymentMethod = PaymentMethod::create($request->validated());

        return (new PaymentMethodResource($paymentMethod->load('type')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Muestra el detalle de un método de pago.
     */
    public function show(PaymentMethod $paymentMethod): PaymentMethodResource
    {
        return new PaymentMethodResource($paymentMethod->load('type'));
    }

    /**
     * Actualiza un método de pago existente.
     */
    public function update(PaymentMethodRequest $request, PaymentMethod $paymentMethod): PaymentMethodResource
    {
        $paymentMethod->update($request->validated());

        return new PaymentMethodResource($paymentMethod->load('type'));
    }

    /**
     * Elimina un método de pago.
     */
    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->delete();

        return response()->json(null, 204);
    }

    /**
     * Alterna el estado activo/inactivo del método de pago.
     */
    public function toggleStatus(PaymentMethod $paymentMethod): PaymentMethodResource
    {
        $paymentMethod->update([
            'is_active' => ! $paymentMethod->is_active,
        ]);

        return new PaymentMethodResource($paymentMethod->load('type'));
    }
}
