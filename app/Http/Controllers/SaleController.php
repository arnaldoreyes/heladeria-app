<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Http\Requests\StoreSaleRequest; // <-- IMPORTAMOS EL REQUEST
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    // Inyectamos el StoreSaleRequest en lugar del genérico Request
    public function store(StoreSaleRequest $request) 
    {
        // Si el código llega aquí, es porque TODO ya fue validado por Laravel.

        DB::beginTransaction();

        try {
            $totalBs = 0;
            $tasaBcv = $request->validated('tasa_bcv'); // Usamos validated() por seguridad

            // Creamos la venta "vacía" primero, ahora incluyendo el método de pago
            $sale = Sale::create([
                'total_bs' => 0, 
                'total_usd' => 0,
                'tasa_bcv' => $tasaBcv,
                'payment_method' => $request->validated('payment_method'), // <-- GUARDAMOS EL MÉTODO
            ]);

            // Recorremos el carrito
            foreach ($request->validated('cart') as $item) {
                $product = Product::find($item['product']['id']);

                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Stock insuficiente para: {$product->name}");
                }

                $subtotalBs = $product->price * $item['quantity'];
                $totalBs += $subtotalBs;

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price_bs' => $product->price,
                ]);

                $product->decrement('stock', $item['quantity']);
            }

            // Actualizamos el total real de la venta
            $sale->update([
                'total_bs' => $totalBs,
                'total_usd' => $totalBs / $tasaBcv
            ]);

            DB::commit();

            return back()->with('success', 'Venta registrada con éxito');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}