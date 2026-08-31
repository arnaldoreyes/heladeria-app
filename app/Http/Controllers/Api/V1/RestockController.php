<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RestockRequest;
use App\Http\Resources\RestockResource;
use App\Models\Restock;
use App\Services\RestockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RestockController extends Controller
{
    public function __construct(
        protected RestockService $restockService
    ) {}

    /**
     * Muestra una lista paginada de compras/reposiciones con filtros, ordenamiento y relaciones.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $restocks = QueryBuilder::for(Restock::class)
            ->allowedFilters(
                // Búsqueda global en proveedor, número de factura o notas
                AllowedFilter::scope('search'),

                // Filtros exactos
                AllowedFilter::exact('status'),
                AllowedFilter::exact('user_id'),

                // Scopes específicos de filtrado
                AllowedFilter::scope('supplier', 'bySupplier'),
                AllowedFilter::scope('start_date', 'startDate'),
                AllowedFilter::scope('end_date', 'endDate'),
                AllowedFilter::scope('date_range', 'byDateRange'),
                AllowedFilter::scope('completed'),
            )
            ->allowedSorts(
                'purchased_at',
                'total_usd',
                'total_bs',
                'supplier_name',
                'status',
                'created_at',
            )
            ->defaultSort('-purchased_at')
            ->allowedIncludes(
                'user',
                'business',
                'items',
                'items.product',
            )
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return RestockResource::collection($restocks);
    }

    /**
     * Registra una nueva reposición de inventario con sus ítems asociados.
     */
    public function store(RestockRequest $request): JsonResponse
    {
        $businessId = app()->bound('current_business_id')
            ? app('current_business_id')
            : $request->user()?->business_id;

        $restock = $this->restockService->createRestock(
            $request->validated(),
            $businessId,
            $request->user()?->id
        );

        return (new RestockResource($restock->load(['items.product', 'user'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Muestra los detalles de una reposición específica.
     */
    public function show(Restock $restock): RestockResource
    {
        return new RestockResource($restock->load(['items.product', 'user', 'business']));
    }

    /**
     * Actualiza los datos de una reposición existente y gestiona sus ítems.
     */
    public function update(RestockRequest $request, Restock $restock): RestockResource
    {
        $updatedRestock = $this->restockService->updateRestock(
            $restock,
            $request->validated()
        );

        return new RestockResource($updatedRestock->load(['items.product', 'user', 'business']));
    }

    /**
     * Elimina el registro de una reposición.
     */
    public function destroy(Restock $restock): JsonResponse
    {
        $this->restockService->deleteRestock($restock);

        return response()->json(null, 204);
    }
}
