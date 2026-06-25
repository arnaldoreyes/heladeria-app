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
        $products = Product::with('category')->get();

        $editSaleData = null;

        
        if ($request->has('edit_sale_id')) {
            $saleId = $request->get('edit_sale_id');
            
            
            $sale = Sale::with(['items.product'])->find($saleId);

            if ($sale && $sale->created_at->isToday()) {
                
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
            }
        }

        return Inertia::render('POS/Index', [
            'products' => $products,
            'editSaleData' => $editSaleData 
        ]);
    }
}