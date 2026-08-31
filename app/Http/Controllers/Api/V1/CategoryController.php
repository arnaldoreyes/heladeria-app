<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkActionRequest;
use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CategoryController extends Controller
{
    /**
     * Muestra el listado de categorías (soporta paginación, tree view y búsqueda).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = QueryBuilder::for(Category::class)
            ->allowedFilters(
                // Filtro de búsqueda por término
                AllowedFilter::scope('search'),

                // Filtros booleanos/de estado
                AllowedFilter::scope('active'),
                AllowedFilter::scope('active_only', 'active'),
                AllowedFilter::scope('root'),
                AllowedFilter::scope('root_only', 'root'),
                AllowedFilter::exact('is_active'),

                // Filtro directo por padre
                AllowedFilter::exact('parent_id'),
            )
            ->allowedSorts(
                'name',
                'slug',
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

            return CategoryResource::collection($categories);
        }

        $categories = $query->with(['parent'])
            ->withCount('products')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return CategoryResource::collection($categories);
    }

    /**
     * Guarda una nueva categoría.
     */
    public function store(CategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return (new CategoryResource($category->load('parent')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Muestra una categoría específica.
     */
    public function show(Category $category): CategoryResource
    {
        return new CategoryResource(
            $category->load(['parent', 'children', 'products'])->loadCount('products')
        );
    }

    /**
     * Actualiza una categoría existente.
     */
    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $category->update($request->validated());

        return new CategoryResource($category->load(['parent', 'children']));
    }

    /**
     * Elimina una categoría asegurando integridad referencial.
     */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->children()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar la categoría porque tiene subcategorías asociadas.',
            ], 422);
        }

        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar la categoría porque tiene productos asignados.',
            ], 422);
        }

        $category->delete();

        return response()->json(null, 204);
    }

    public function bulkDestroy(BulkActionRequest $request): JsonResponse
    {
        $deletedCount = Category::destroy($request->ids);

        return response()->json([
            'status'  => 'success',
            'message' => "Se han eliminado {$deletedCount} negocios correctamente.",
            'data'    => [
                'deleted_count' => $deletedCount,
            ],
        ]);
    }
}
