<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RoleController extends Controller
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    /**
     * Muestra una lista paginada de roles con filtros, ordenamiento y relaciones.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $roles = QueryBuilder::for(Role::class)
            ->allowedFilters(
                // Búsqueda global por nombre o guard_name
                AllowedFilter::scope('search'),

                // Filtros exactos
                AllowedFilter::exact('name'),
                AllowedFilter::exact('guard_name'),

                // Scope para filtrado por guard
                AllowedFilter::scope('guard', 'byGuard'),
            )
            ->allowedSorts(
                'name',
                'guard_name',
                'created_at',
                'updated_at',
            )
            ->defaultSort('name')
            ->allowedIncludes(
                'permissions',
                'users',
            )
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return RoleResource::collection($roles);
    }

    /**
     * Crea un nuevo rol y sincroniza sus permisos.
     */
    public function store(RoleRequest $request): JsonResponse
    {
        $role = $this->roleService->createRole($request->validated());

        return (new RoleResource($role->load('permissions')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Muestra los detalles de un rol específico con sus relaciones.
     */
    public function show(Role $role): RoleResource
    {
        return new RoleResource($role->load(['permissions', 'users']));
    }

    /**
     * Actualiza un rol existente y sus permisos asociados.
     */
    public function update(RoleRequest $request, Role $role): RoleResource
    {
        $updatedRole = $this->roleService->updateRole($role, $request->validated());

        return new RoleResource($updatedRole->load('permissions'));
    }

    /**
     * Elimina un rol.
     */
    public function destroy(Role $role): JsonResponse
    {
        $this->roleService->deleteRole($role);

        return response()->json(null, 204);
    }
}
