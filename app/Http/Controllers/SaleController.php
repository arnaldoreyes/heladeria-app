<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Http\Requests\StoreSaleRequest;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SaleController extends Controller
{
    public function store(StoreSaleRequest $request) 
    {
        DB::beginTransaction();

        try {
            $tasaBcv = $request->validated('tasa_bcv');
            $totalBs = $request->validated('total_bs');
            $totalUsd = $request->validated('total_usd');
            $discountBs = $request->validated('discount_bs');
            $paymentMethod = $request->validated('payment_method');
            $changeLossBs = $request->validated('change_loss_bs');

            // Creamos la venta ya con los datos finales
            $sale = Sale::create([
                'total_bs' => $totalBs, 
                'total_usd' => $totalUsd,
                'discount_bs' => $discountBs, 
                'tasa_bcv' => $tasaBcv,
                'payment_method' => $paymentMethod,
                'change_loss_bs' => $changeLossBs,
            ]);

            foreach ($request->validated('cart') as $item) {
                $product = Product::lockForUpdate()->find($item['product']['id']);

                if (!$product || $product->stock < $item['quantity']) {
                    throw new \Exception("Stock insuficiente para: " . ($product->name ?? 'Producto desconocido'));
                }

                $precioRealBs = $product->price_usd * $tasaBcv;

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price_bs' => $precioRealBs, 
                ]);

                $product->decrement('stock', $item['quantity']);
            }

            DB::commit();

            return back()->with('success', 'Venta registrada con éxito');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function update(StoreSaleRequest $request, Sale $sale)
    {
        // 1. Regla de Negocio: Solo permitir edición de tickets del día actual
        if (!$sale->created_at->isToday()) {
            return back()->withErrors(['error' => 'Solo se pueden editar tickets de ventas emitidas en el día actual para mantener la integridad contable.']);
        }

        DB::beginTransaction();

        try {
            // 2. Reversión del inventario original
            // Bloqueamos los productos actuales para evitar lecturas sucias
            $currentItems = $sale->items()->with('product')->get();
            foreach ($currentItems as $item) {
                if ($item->product) {
                    // Devolvemos el stock original al inventario
                    Product::where('id', $item->product_id)->lockForUpdate()->increment('stock', $item->quantity);
                }
            }

            // 3. Limpiar los ítems antiguos del ticket
            $sale->items()->delete();

            // 4. Procesar el nuevo carrito y descontar el nuevo inventario
            foreach ($request->validated('cart') as $cartItem) {
                $product = Product::lockForUpdate()->find($cartItem['product']['id']);

                if (!$product || $product->stock < $cartItem['quantity']) {
                    throw new \Exception("Stock insuficiente para: " . ($product->name ?? 'Producto desconocido'));
                }

                $precioRealBs = $product->price_usd * $request->validated('tasa_bcv');

                // Crear el nuevo registro del ítem vendido
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $cartItem['quantity'],
                    'price_bs' => $precioRealBs, 
                ]);

                // Descontar el nuevo stock
                $product->decrement('stock', $cartItem['quantity']);
            }

            // 5. Actualizar los totales del ticket principal
            $sale->update([
                'total_bs' => $request->validated('total_bs'), 
                'total_usd' => $request->validated('total_usd'),
                'discount_bs' => $request->validated('discount_bs'), 
                'tasa_bcv' => $request->validated('tasa_bcv'),
                'payment_method' => $request->validated('payment_method'),
                'change_loss_bs' => $request->validated('change_loss_bs'),
            ]);

            DB::commit();

            return back()->with('success', 'Ticket de venta #' . $sale->id . ' actualizado correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Error al modificar el ticket: ' . $e->getMessage()]);
        }
    }
}