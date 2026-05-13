<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Http\Requests\StoreSaleRequest;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function store(StoreSaleRequest $request) 
    {
        DB::beginTransaction();

        try {
            $totalBs = 0;
            $totalUsd = 0; // <-- Agregamos sumatoria paralela para cuadrar exacto con React
            $tasaBcv = $request->validated('tasa_bcv');

            // Creamos la venta "vacía" primero
            $sale = Sale::create([
                'total_bs' => 0, 
                'total_usd' => 0,
                'tasa_bcv' => $tasaBcv,
                'payment_method' => $request->validated('payment_method'),
            ]);

            // Recorremos el carrito
            foreach ($request->validated('cart') as $item) {
                $product = Product::find($item['product']['id']);

                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Stock insuficiente para: {$product->name}");
                }

                // <-- CORRECCIÓN: Usamos price_bs y price_usd directamente del modelo Product
                $subtotalBs = $product->price_bs * $item['quantity'];
                $subtotalUsd = $product->price_usd * $item['quantity'];
                
                $totalBs += $subtotalBs;
                $totalUsd += $subtotalUsd;

                // Creamos el detalle de la venta
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price_bs' => $product->price_bs, // <-- Pasamos el campo correcto
                    // 'price_usd' => $product->price_usd, // (Descomenta esta línea si tu tabla sale_items también tiene la columna price_usd)
                ]);

                $product->decrement('stock', $item['quantity']);
            }

            // Actualizamos la venta con los totales exactos
            $sale->update([
                'total_bs' => $totalBs,
                'total_usd' => $totalUsd // <-- Sinergia total, cero desfases por redondeo
            ]);

            DB::commit();

            return back()->with('success', 'Venta registrada con éxito');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}