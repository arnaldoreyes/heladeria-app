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
}