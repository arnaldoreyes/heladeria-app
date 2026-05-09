<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validamos que nos llegue el carrito y la tasa
        $request->validate([
            'cart' => 'required|array',
            'cart.*.product.id' => 'required|exists:products,id',
            'cart.*.quantity' => 'required|integer|min:1',
            'tasa_bcv' => 'required|numeric'
        ]);

        // 2. Iniciamos la transacción segura
        DB::beginTransaction();

        try {
            $totalBs = 0;
            $tasaBcv = $request->tasa_bcv;

            // Creamos la venta "vacía" primero para obtener un ID
            $sale = Sale::create([
                'total_bs' => 0, 
                'total_usd' => 0,
                'tasa_bcv' => $tasaBcv
            ]);

            // 3. Recorremos el carrito
            foreach ($request->cart as $item) {
                // Buscamos el producto real en DB (nunca confíes en el precio que manda el frontend por seguridad)
                $product = Product::find($item['product']['id']);

                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Stock insuficiente para: {$product->name}");
                }

                $subtotalBs = $product->price * $item['quantity'];
                $totalBs += $subtotalBs;

                // Guardamos el item de la factura
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price_bs' => $product->price,
                ]);

                // ¡DESCONTAMOS EL INVENTARIO!
                $product->decrement('stock', $item['quantity']);
            }

            // 4. Actualizamos el total real de la venta
            $sale->update([
                'total_bs' => $totalBs,
                'total_usd' => $totalBs / $tasaBcv
            ]);

            DB::commit();

            // Retornamos a la misma vista sin recargar la página (Magia de Inertia)
            return back()->with('success', 'Venta registrada con éxito');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}