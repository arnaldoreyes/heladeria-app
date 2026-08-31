<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ProductController extends Controller
{
    /**
     * Lista paginada de productos con filtros avanzados, ordenamiento y relaciones.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = QueryBuilder::for(Product::class)
            ->allowedFilters(
                // Búsqueda global en nombre o SKU
                AllowedFilter::scope('search'),

                // Filtros exactos
                AllowedFilter::exact('category_id'),
                AllowedFilter::exact('sku'),
                AllowedFilter::exact('is_active'),

                // Scopes específicos de estado e inventario
                AllowedFilter::scope('low_stock', 'lowStock'),
                AllowedFilter::scope('active_only', 'active'),
            )
            ->allowedSorts(
                'name',
                'sku',
                'price_usd',
                'cost_usd',
                'stock',
                'created_at',
            )
            ->defaultSort('-created_at')
            ->allowedIncludes(
                'category',
                'business',
                'inventoryMovements',
            )
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return ProductResource::collection($products);
    }

    /**
     * Crear un nuevo producto.
     */
    public function store(ProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());

        return (new ProductResource($product->load('category')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Mostrar los detalles de un producto.
     */
    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['category', 'business']));
    }

    /**
     * Actualizar un producto existente.
     */
    public function update(ProductRequest $request, Product $product): ProductResource
    {
        $product->update($request->validated());

        return new ProductResource($product->fresh('category'));
    }

    /**
     * Eliminar un producto.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(null, 204);
    }
}
