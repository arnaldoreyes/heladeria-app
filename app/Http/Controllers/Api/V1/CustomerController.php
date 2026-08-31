<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkActionRequest;
use App\Http\Requests\CustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CustomerController extends Controller
{
    /**
     * Muestra el listado de clientes con filtros, ordenamiento y paginación.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $customers = QueryBuilder::for(Customer::class)
            ->allowedFilters(
                // Filtro global por término (nombre, id_document, email, phone)
                AllowedFilter::scope('search'),

                // Filtros de estado y crédito mediante scopes
                AllowedFilter::scope('active'),
                AllowedFilter::scope('active_only', 'active'),
                AllowedFilter::scope('with_credit', 'withCredit'),
                AllowedFilter::exact('is_active'),

                // Filtros exactos por documento
                AllowedFilter::exact('type_document'),
                AllowedFilter::exact('id_document'),
            )
            ->allowedSorts(
                'name',
                'email',
                'id_document',
                'credit_limit_usd',
                'created_at',
            )
            ->defaultSort('name')
            ->allowedIncludes(
                'sales',
            )
            ->withCount('sales')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return CustomerResource::collection($customers);
    }

    /**
     * Registra un nuevo cliente.
     */
    public function store(CustomerRequest $request): JsonResponse
    {
        $customer = Customer::create($request->validated());

        return (new CustomerResource($customer))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Muestra los datos de un cliente específico.
     */
    public function show(Customer $customer): CustomerResource
    {
        return new CustomerResource(
            $customer->loadCount('sales')
        );
    }

    /**
     * Actualiza los datos de un cliente.
     */
    public function update(CustomerRequest $request, Customer $customer): CustomerResource
    {
        $customer->update($request->validated());

        return new CustomerResource($customer);
    }

    /**
     * Elimina un cliente asegurando integridad referencial.
     */
    public function destroy(Customer $customer): JsonResponse
    {
        if ($customer->sales()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar el cliente porque tiene ventas o transacciones asociadas.',
            ], 422);
        }

        $customer->delete();

        return response()->json(null, 204);
    }

    public function bulkDestroy(BulkActionRequest $request): JsonResponse
    {
        $deletedCount = Customer::destroy($request->ids);

        return response()->json([
            'status'  => 'success',
            'message' => "Se han eliminado {$deletedCount} negocios correctamente.",
            'data'    => [
                'deleted_count' => $deletedCount,
            ],
        ]);
    }
}
