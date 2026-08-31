<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PermissionController extends Controller
{
    /**
     * Listar todos los permisos disponibles en el sistema con filtros, ordenamiento y paginación.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $permissions = QueryBuilder::for(Permission::class)
            ->allowedFilters(
                // Búsqueda global por nombre o guard
                AllowedFilter::scope('search'),

                // Filtros parciales y exactos
                AllowedFilter::partial('name'),
                AllowedFilter::exact('guard_name'),
            )
            ->allowedSorts(
                'name',
                'guard_name',
                'created_at',
            )
            ->defaultSort('name')
            ->paginate($request->integer('per_page', 50))
            ->appends($request->query());

        return PermissionResource::collection($permissions);
    }
}
