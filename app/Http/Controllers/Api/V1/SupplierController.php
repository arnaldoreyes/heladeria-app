<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkActionRequest;
use App\Http\Requests\Supplier\SupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SupplierController extends Controller
{
    use ApiResponse;

    /**
     * Muestra el listado de Proveedores (soporta paginación, filtros y búsqueda).
     */
    public function index(Request $request): JsonResponse
    {
        $suppliers = QueryBuilder::for(Supplier::class)
            ->allowedFilters(
                // Búsqueda por término parcial (nombre, documento fiscal, contacto, email, teléfono)
                AllowedFilter::callback('search', function ($query, $value) {
                    $query->where(function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%")
                          ->orWhere('tax_id', 'like', "%{$value}%")
                          ->orWhere('contact_name', 'like', "%{$value}%")
                          ->orWhere('email', 'like', "%{$value}%")
                          ->orWhere('phone', 'like', "%{$value}%");
                    });
                }),

                // Filtro directo por estado (activo/inactivo)
                AllowedFilter::exact('is_active'),

                // Filtro directo por negocio
                AllowedFilter::exact('business_id'),
            )
            ->allowedSorts(
                'name',
                'tax_id',
                'contact_name',
                'is_active',
                'created_at',
            )
            ->defaultSort('name')
            ->allowedIncludes(
                'restocks',
                'business',
            )
            ->withCount('restocks')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return $this->successResponse(
            SupplierResource::collection($suppliers)->response()->getData(true),
            'Proveedores obtenidos exitosamente'
        );
    }

    /**
     * Guarda un nuevo Proveedor.
     */
    public function store(SupplierRequest $request): JsonResponse
    {
        $supplier = Supplier::create($request->validated());

        return $this->successResponse(
            new SupplierResource($supplier),
            'Proveedor creado exitosamente',
            201
        );
    }

    /**
     * Muestra un Proveedor específico.
     */
    public function show(Supplier $supplier): JsonResponse
    {
        return $this->successResponse(
            new SupplierResource($supplier->loadCount('restocks'))
        );
    }

    /**
     * Actualiza un Proveedor existente.
     */
    public function update(SupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $supplier->update($request->validated());

        return $this->successResponse(
            new SupplierResource($supplier),
            'Proveedor actualizado exitosamente'
        );
    }

    /**
     * Elimina un Proveedor asegurando integridad referencial con los reabastecimientos.
     */
    public function destroy(Supplier $supplier): JsonResponse
    {
        if ($supplier->restocks()->exists()) {
            return $this->errorResponse(
                'No se puede eliminar el proveedor porque tiene reabastecimientos o compras asociadas.',
                422
            );
        }

        $supplier->delete();

        return $this->successResponse(
            null,
            'Proveedor eliminado exitosamente'
        );
    }

    /**
     * Elimina múltiples proveedores en bloque.
     */
    public function bulkDestroy(BulkActionRequest $request): JsonResponse
    {
        // Se filtran solo los proveedores que no tengan compras/reabastecimientos
        $suppliersWithRestocks = Supplier::whereIn('id', $request->ids)
            ->has('restocks')
            ->pluck('id')
            ->toArray();

        $idsToDelete = array_diff($request->ids, $suppliersWithRestocks);

        $deletedCount = Supplier::destroy($idsToDelete);

        $message = "Se eliminaron {$deletedCount} proveedores exitosamente.";
        if (count($suppliersWithRestocks) > 0) {
            $message .= " (" . count($suppliersWithRestocks) . " no se pudieron eliminar por tener reabastecimientos asociados).";
        }

        return $this->successResponse(
            ['deleted_count' => $deletedCount],
            $message
        );
    }
}
