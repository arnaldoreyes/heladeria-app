<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkActionRequest;

use App\Http\Resources\CategoryResource;
use App\Http\Requests\Category\CategoryRequest;
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

                // Filtro directo por padre
                AllowedFilter::exact('parent_id'),
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
                'Categorias obtenidas exitosamente'
            );
        }

        $categories = $query->with(['parent'])
            ->withCount('products')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());
        
        return $this->successResponse(
            CategoryResource::collection($categories)->response()->getData(true),
            'Categorias obtenidas exitosamente'
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
            'Categoria creada exitosamente'
        );

    }

    /**
     * Muestra una categoría específica.
     */
    public function show(Category $category): JsonResponse
    {
        return $this->successResponse(
           new CategoryResource($category->load(['parent', 'children', 'products'])));
    }

    /**
     * Actualiza una categoría existente.
     */
    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());

        return $this->successResponse(
           new CategoryResource($category->load('parent', 'children')),
            'Categoria actualizada exitosamente'
        );
    }

    /**
     * Elimina una categoría asegurando integridad referencial.
     */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->children()->exists()) {
            
            return $this->errorResponse(
                'No se puede eliminar la categoría porque tiene subcategorías asociadas.'
            );
        }

        if ($category->products()->exists()) {
            return $this->errorResponse(
                'No se puede eliminar la categoría porque tiene productos asignados.'
            );
        }

        $category->delete();

        return $this->successResponse(
            null,
            'Método de pago eliminado exitosamente'
        );
    }

    public function bulkDestroy(BulkActionRequest $request): JsonResponse
    {
        $deletedCount = Category::destroy($request->ids);
        return $this->successResponse(['deleted_count' => $deletedCount], "Se eliminaron {$deletedCount} registros");
    }


    
}
