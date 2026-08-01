<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(Request $request): Response
    {
        $editSaleData = null;
        
        // 1. Consulta base: Solo productos con stock > 0
        $productsQuery = Product::with('category')->where('stock', '>', 0);

        if ($request->has('edit_sale_id')) {
            $saleId = $request->get('edit_sale_id');
            $sale = Sale::with(['items.product'])->find($saleId);

            if ($sale && $sale->created_at->isToday()) {
                // Preparamos los datos para el frontend
                $editSaleData = [
                    'id' => $sale->id,
                    'payment_method' => $sale->payment_method,
                    'amount_paid' => $sale->total_bs + $sale->change_loss_bs,
                    'items' => $sale->items->map(function ($item) {
                        return [
                            'product' => $item->product,
                            'quantity' => $item->quantity,
                        ];
                    })->toArray(),
                ];

                // 2. Modo Edición: Asegurarnos de incluir los productos de este ticket, 
                // incluso si actualmente tienen stock 0.
                $productIdsInSale = $sale->items->pluck('product_id')->toArray();
                
                if (!empty($productIdsInSale)) {
                    // Usamos orWhereIn para traer los que tienen stock > 0 O los que están en la venta
                    $productsQuery->orWhereIn('id', $productIdsInSale);
                }
            }
        }

        // Ejecutamos la consulta
        $products = $productsQuery->get();

        $categories = \Illuminate\Support\Facades\Cache::remember('categories.all', 3600, function () {
            return \App\Models\Category::all()->values();
        });

        return Inertia::render('POS/Index', [
            'products' => $products,
            'categories' => $categories,
            'editSaleData' => $editSaleData 
        ]);
    }
}