<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkActionRequest;
use App\Http\Requests\Business\BusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Models\Business;
use App\Traits\ApiResponse; 
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class BusinessController extends Controller
{
    use ApiResponse; 

    /**
     * Listar todos los negocios.
     */
    public function index(Request $request): JsonResponse
    {
        $businesses = QueryBuilder::for(Business::class)
            ->allowedFilters(
                AllowedFilter::scope('search'),
                AllowedFilter::exact('status'),
            )
            ->allowedSorts('name', 'status', 'created_at')
            ->defaultSort('-created_at')
            ->allowedIncludes('setting', 'users', 'exchangeRates')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        
        return $this->successResponse(
            BusinessResource::collection($businesses)->response()->getData(true)
        );
    }

    /**
     * Crear un nuevo negocio / tenant.
     */
    public function store(BusinessRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $validated['status'] = $validated['status'] ?? 'active';

        $business = DB::transaction(function () use ($validated) {
            $business = Business::create($validated);
            
            // Si vienen settings en el payload se guardan, de lo contrario se usa array vacío
            $settingsData = $validated['settings'] ?? [];
            $business->setting()->create($settingsData);

            return $business;
        });

        return $this->successResponse(
            new BusinessResource($business->load('setting')),
            'Negocio registrado exitosamente.',
            201
        );
    }

    /**
     * Mostrar los detalles de un negocio específico.
     */
    public function show(Business $business): JsonResponse
    {
        $business->load([
            'setting',
            'exchangeRates' => fn ($q) => $q->latest()->limit(1)
        ]);

        return $this->successResponse(new BusinessResource($business));
    }

    /**
     * Actualizar los datos principales y configuraciones (Settings).
     */
    public function update(BusinessRequest $request, Business $business): JsonResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($business, $validated) {
            // 1. Actualizar los campos directos de la tabla Business
            $business->update($validated);

            // 2. Si vienen datos de 'settings' en el payload, actualizar o crear la relación
            if (isset($validated['settings']) && is_array($validated['settings'])) {
                $business->setting()->updateOrCreate(
                    ['business_id' => $business->id],
                    $validated['settings']
                );
            }
        });

        return $this->successResponse(
            new BusinessResource($business->fresh(['setting', 'exchangeRates'])),
            'Información del negocio actualizada exitosamente.'
        );
    }

    /**
     * Eliminar un negocio.
     */
    public function destroy(Business $business): JsonResponse
    {
        $business->delete();

        return $this->successResponse(null, 'Negocio eliminado correctamente.');
    }

    /**
     * Obtener el perfil del negocio del usuario autenticado.
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->business_id) {
            return $this->errorResponse('El usuario no pertenece a ningún negocio activo.', 404);
        }

        $business = Business::with([
            'setting',
            'exchangeRates' => fn ($q) => $q->latest()->limit(1)
        ])->find($user->business_id);

        if (!$business) {
            return $this->errorResponse('Negocio no encontrado.', 404);
        }

        return $this->successResponse(new BusinessResource($business));
    }

    /**
     * Cambiar de estado al negocio.
     */
    public function toggleStatus(Request $request, Business $business): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        $business->update(['status' => $validated['status']]);

        return $this->successResponse(
            new BusinessResource($business),
            "El estado del negocio ha sido cambiado a: {$business->status}"
        );
    }

    /**
     * Borrado masivo.
     */
    public function bulkDestroy(BulkActionRequest $request): JsonResponse
    {
        $deletedCount = Business::destroy($request->ids);

        return $this->successResponse(
            ['deleted_count' => $deletedCount],
            "Se han eliminado {$deletedCount} negocios correctamente."
        );
    }
}