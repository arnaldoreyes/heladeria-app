<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkActionRequest;
use App\Http\Requests\Category\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CategoryController extends Controller
{
    use ApiResponse;

    /**
     * Muestra el listado de categorías (soporta paginación, tree view y búsqueda).
     */
    public function index(Request $request): JsonResponse
    {
        $query = QueryBuilder::for(Category::class)
            ->allowedFilters(
                // Filtro de búsqueda por término
                AllowedFilter::scope('search'),

                // Filtros booleanos/de estado
                AllowedFilter::scope('root'),
                AllowedFilter::scope('root_only', 'root'),

                // Filtro directo por padre y negocio
                AllowedFilter::exact('parent_id'),
                AllowedFilter::exact('business_id'),
            )
            ->allowedSorts(
                'name',
                'profit_percentage',
                'reinvestment_percentage',
                'created_at',
            )
            ->defaultSort('name')
            ->allowedIncludes(
                'parent',
                'children',
                'childrenRecursive',
                'products',
            );

        // Carga en modo árbol jerárquico completo si se solicita
        if ($request->boolean('tree')) {
            $categories = $query->root()
                ->with(['childrenRecursive'])
                ->get();

            return $this->successResponse(
                CategoryResource::collection($categories)->response()->getData(true),
                'Categorías obtenidas exitosamente'
            );
        }

        $categories = $query->with(['parent'])
            ->withCount('products')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return $this->successResponse(
            CategoryResource::collection($categories)->response()->getData(true),
            'Categorías obtenidas exitosamente'
        );
    }

    /**
     * Guarda una nueva categoría.
     */
    public function store(CategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return $this->successResponse(
            new CategoryResource($category->load('parent')),
            'Categoría creada exitosamente',
            201
        );
    }

    /**
     * Muestra una categoría específica.
     */
    public function show(Category $category): JsonResponse
    {
        return $this->successResponse(
            new CategoryResource($category->load(['parent', 'children', 'products'])->loadCount('products'))
        );
    }

    /**
     * Actualiza una categoría existente.
     */
    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());

        return $this->successResponse(
            new CategoryResource($category->load('parent', 'children')),
            'Categoría actualizada exitosamente'
        );
    }

    /**
     * Elimina una categoría asegurando integridad referencial.
     */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->children()->exists()) {
            return $this->errorResponse(
                'No se puede eliminar la categoría porque tiene subcategorías asociadas.',
                422
            );
        }

        if ($category->products()->exists()) {
            return $this->errorResponse(
                'No se puede eliminar la categoría porque tiene productos asignados.',
                422
            );
        }

        $category->delete();

        return $this->successResponse(
            null,
            'Categoría eliminada exitosamente'
        );
    }

    /**
     * Elimina múltiples categorías en bloque protegiendo las que tengan relaciones.
     */
    public function bulkDestroy(BulkActionRequest $request): JsonResponse
    {
        // Se identifican las categorías con subcategorías o productos para no eliminarlas
        $protectedCategoryIds = Category::whereIn('id', $request->ids)
            ->where(function ($query) {
                $query->has('children')->orHas('products');
            })
            ->pluck('id')
            ->toArray();

        $idsToDelete = array_diff($request->ids, $protectedCategoryIds);

        $deletedCount = Category::destroy($idsToDelete);

        $message = "Se eliminaron {$deletedCount} categorías exitosamente.";
        if (count($protectedCategoryIds) > 0) {
            $message .= " (" . count($protectedCategoryIds) . " no se pudieron eliminar por tener productos o subcategorías asociadas).";
        }

        return $this->successResponse(
            ['deleted_count' => $deletedCount],
            $message
        );
    }
}
