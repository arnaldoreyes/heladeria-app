<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkActionRequest;
use App\Http\Requests\Business\BusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Validation\Rule;
use Spatie\QueryBuilder\AllowedFilter;

class BusinessController extends Controller
{
    /**
     * Listar todos los negocios (Para SuperAdmin o paneles de administración global).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $businesses = QueryBuilder::for(Business::class)
            ->allowedFilters(
                AllowedFilter::scope('search'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('niche'),
            )
            ->allowedSorts(
                'name',
                'slug',
                'niche',
                'status',
                'created_at',
            )
            ->defaultSort('-created_at')
            ->allowedIncludes(
                'settings',
                'users',
                'exchangeRates',
            )
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());
        return BusinessResource::collection($businesses);
    }

    /**
     * Crear un nuevo negocio / tenant.
     */
    public function store(BusinessRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Autogenerar slug si no se envía explícitamente
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Estado por defecto
        $validated['status'] = $validated['status'] ?? 'active';

        $business = Business::create($validated);

        // Crear la relación inicial de configuraciones por defecto
        $business->settings()->create();

        return response()->json([
            'status'  => 'success',
            'message' => 'Negocio registrado exitosamente.',
            'data'    => new BusinessResource($business->load('settings')),
        ], 201);
    }

    /**
     * Mostrar los detalles de un negocio específico por ID/ULID o Slug.
     */
    public function show(Business $business): JsonResponse
    {
        $business->load([
            'settings',
            'exchangeRates' => fn ($q) => $q->latest()->limit(1)
        ]);

        return response()->json([
            'status' => 'success',
            'data'   => new BusinessResource($business),
        ]);
    }

    /**
     * Actualizar los datos principales del negocio.
     */
    public function update(BusinessRequest $request, Business $business): JsonResponse
    {
        $validated = $request->validated();

        // Regenerar slug solo si cambia el nombre y no se pasó un slug manual
        if (isset($validated['name']) && empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $business->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Información del negocio actualizada.',
            'data'    => new BusinessResource($business->fresh('settings')),
        ]);
    }

    /**
     * Eliminar un negocio.
     */
    public function destroy(Business $business): JsonResponse
    {
        $business->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Negocio eliminado correctamente.',
        ]);
    }

    /**
     * Obtener el perfil del negocio del usuario autenticado.
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->business_id) {
            return response()->json([
                'status'  => 'error',
                'message' => 'El usuario no pertenece a ningún negocio activo.',
            ], 404);
        }

        $business = Business::with([
            'settings',
            'exchangeRates' => fn ($q) => $q->latest()->limit(1)
        ])->findOrFail($user->business_id);

        return response()->json([
            'status' => 'success',
            'data'   => new BusinessResource($business),
        ]);
    }

    /**
     * Cambiar de estado al negocio (Activar/Suspender).
     */
    public function toggleStatus(Request $request, Business $business): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        $business->update(['status' => $validated['status']]);

        return response()->json([
            'status'  => 'success',
            'message' => "El estado del negocio ha sido cambiado a: {$business->status}",
            'data'    => new BusinessResource($business),
        ]);
    }

     public function bulkDestroy(BulkActionRequest $request): JsonResponse
    {
        $deletedCount = Business::destroy($request->ids);

        return response()->json([
            'status'  => 'success',
            'message' => "Se han eliminado {$deletedCount} negocios correctamente.",
            'data'    => [
                'deleted_count' => $deletedCount,
            ],
        ]);
    }
}
