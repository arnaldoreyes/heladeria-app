<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryMovementRequest;
use App\Http\Resources\InventoryMovementResource;
use App\Models\InventoryMovement;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InventoryMovementController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Listado de movimientos de inventario con filtros avanzados, ordenamiento y paginación.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $movements = QueryBuilder::for(InventoryMovement::class)
            ->allowedFilters(
                // Búsqueda global en notas, nombre del producto o SKU
                AllowedFilter::scope('search'),

                // Filtros exactos
                AllowedFilter::exact('product_id'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('user_id'),
                AllowedFilter::exact('reference_type'),
                AllowedFilter::exact('reference_id'),

                // Filtros de fecha
                AllowedFilter::scope('start_date', 'startDate'),
                AllowedFilter::scope('end_date', 'endDate'),
                AllowedFilter::scope('date_range', 'byDateRange'),
            )
            ->allowedSorts(
                'created_at',
                'quantity',
                'type',
                'previous_stock',
                'new_stock',
            )
            ->defaultSort('-created_at')
            ->allowedIncludes(
                'product',
                'user',
                'reference',
            )
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return InventoryMovementResource::collection($movements);
    }

    /**
     * Registra un ajuste o movimiento manual de inventario.
     */
    public function store(InventoryMovementRequest $request): JsonResponse
    {
        $businessId = app()->bound('current_business_id')
            ? app('current_business_id')
            : $request->user()?->business_id;

        $movement = $this->inventoryService->registerMovement(
            $request->validated(),
            $businessId,
            $request->user()?->id
        );

        return (new InventoryMovementResource($movement->load(['product', 'user', 'reference'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Muestra el detalle de un movimiento de inventario específico.
     */
    public function show(InventoryMovement $inventoryMovement): InventoryMovementResource
    {
        return new InventoryMovementResource($inventoryMovement->load(['product', 'user', 'reference']));
    }

    /**
     * Los movimientos de inventario son inmutables por motivos de auditoría.
     */
    public function update(): JsonResponse
    {
        return response()->json([
            'message' => 'Los movimientos de inventario no pueden ser editados directamente.'
        ], 405);
    }

    /**
     * Los movimientos de inventario no son eliminables.
     */
    public function destroy(): JsonResponse
    {
        return response()->json([
            'message' => 'Los movimientos de inventario no pueden ser eliminados.'
        ], 405);
    }
}
