<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Http\Requests\StoreSaleRequest;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Services\CurrencyService;


class SaleController extends Controller
{
    public function store(StoreSaleRequest $request, CurrencyService $currencyService) 
    {
        DB::beginTransaction();

        try {
            $tasaBcv = $currencyService->getCurrentRate();
            $totalBs = $request->validated('total_bs');
            $totalUsd = $request->validated('total_usd');
            $discountBs = $request->validated('discount_bs');
            $paymentMethod = $request->validated('payment_method');
            $changeLossBs = $request->validated('change_loss_bs');

            $businessPercentage = (float) (\App\Models\Setting::where('key', 'business_percentage')->value('value') ?? 60);
            $profitPercentage = (float) (\App\Models\Setting::where('key', 'profit_percentage')->value('value') ?? 40);

            $consolidatedCart = [];
            foreach ($request->validated('cart') as $item) {
                $productId = $item['product']['id'];
                if (isset($consolidatedCart[$productId])) {
                    $consolidatedCart[$productId]['quantity'] += $item['quantity'];
                } else {
                    $consolidatedCart[$productId] = $item;
                }
            }

            $totalCostUsd = 0;
            $itemsToCreate = [];

            foreach ($consolidatedCart as $item) {
                $product = Product::lockForUpdate()->find($item['product']['id']);

                if (!$product || $product->stock < $item['quantity']) {
                    throw new \Exception("Stock insuficiente para: " . ($product->name ?? 'Producto desconocido'));
                }

                $precioRealBs = $product->price_usd * $tasaBcv;
                $costoUsd = (float) ($product->cost_usd ?? 0);
                $totalCostUsd += ($costoUsd * $item['quantity']);

                $itemsToCreate[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'price_bs' => $precioRealBs,
                    'cost_usd' => $costoUsd,
                ];
            }

            $marginUsd = max(0, $totalUsd - $totalCostUsd);
            $reinvestmentUsd = $marginUsd * ($businessPercentage / 100);
            $profitUsd = $marginUsd * ($profitPercentage / 100);

            $sale = Sale::create([
                'total_bs' => $totalBs, 
                'total_usd' => $totalUsd,
                'cost_usd' => $totalCostUsd,
                'margin_usd' => $marginUsd,
                'reinvestment_usd' => $reinvestmentUsd,
                'profit_usd' => $profitUsd,
                'discount_bs' => $discountBs, 
                'tasa_bcv' => $tasaBcv,
                'payment_method' => $paymentMethod,
                'change_loss_bs' => $changeLossBs,
            ]);

            foreach ($itemsToCreate as $itemData) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $itemData['product']->id,
                    'quantity' => $itemData['quantity'],
                    'price_bs' => $itemData['price_bs'],
                    'cost_usd' => $itemData['cost_usd'],
                ]);

                $itemData['product']->decrement('stock', $itemData['quantity']);
            }

            DB::commit();

            return back()->with('success', 'Venta registrada con éxito');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function update(StoreSaleRequest $request, Sale $sale, CurrencyService $currencyService)
{
    if (!$sale->created_at->isToday()) {
        return back()->withErrors(['error' => 'Solo se pueden editar tickets de ventas emitidas en el día actual para mantener la integridad contable.']);
    }

    DB::beginTransaction();

    try {
        $tasaBcv = $currencyService->getCurrentRate(); // <- calculada server-side, no del request

        $currentItems = $sale->items()->with('product')->get();
        foreach ($currentItems as $item) {
            if ($item->product) {
                Product::where('id', $item->product_id)->lockForUpdate()->increment('stock', $item->quantity);
            }
        }

        $sale->items()->delete();

        $businessPercentage = (float) (\App\Models\Setting::where('key', 'business_percentage')->value('value') ?? 60);
        $profitPercentage = (float) (\App\Models\Setting::where('key', 'profit_percentage')->value('value') ?? 40);

        $totalCostUsd = 0;
        $itemsToCreate = [];

        $consolidatedCart = [];
        foreach ($request->validated('cart') as $cartItem) {
            $productId = $cartItem['product']['id'];
            if (isset($consolidatedCart[$productId])) {
                $consolidatedCart[$productId]['quantity'] += $cartItem['quantity'];
            } else {
                $consolidatedCart[$productId] = $cartItem;
            }
        }

        foreach ($consolidatedCart as $cartItem) {
            $product = Product::lockForUpdate()->find($cartItem['product']['id']);

            if (!$product || $product->stock < $cartItem['quantity']) {
                throw new \Exception("Stock insuficiente para: " . ($product->name ?? 'Producto desconocido'));
            }

            $precioRealBs = $product->price_usd * $tasaBcv; // <- usa la variable, no el request
            $costoUsd = (float) ($product->cost_usd ?? 0);
            $totalCostUsd += ($costoUsd * $cartItem['quantity']);

            $itemsToCreate[] = [
                'product' => $product,
                'quantity' => $cartItem['quantity'],
                'price_bs' => $precioRealBs,
                'cost_usd' => $costoUsd,
            ];
        }

        $totalUsd = $request->validated('total_usd');
        $marginUsd = max(0, $totalUsd - $totalCostUsd);
        $reinvestmentUsd = $marginUsd * ($businessPercentage / 100);
        $profitUsd = $marginUsd * ($profitPercentage / 100);

        foreach ($itemsToCreate as $itemData) {
            SaleItem::create([
                'sale_id' => $sale->id,
                'product_id' => $itemData['product']->id,
                'quantity' => $itemData['quantity'],
                'price_bs' => $itemData['price_bs'],
                'cost_usd' => $itemData['cost_usd'],
            ]);

            $itemData['product']->decrement('stock', $itemData['quantity']);
        }

        $sale->update([
            'total_bs' => $request->validated('total_bs'),
            'total_usd' => $totalUsd,
            'cost_usd' => $totalCostUsd,
            'margin_usd' => $marginUsd,
            'reinvestment_usd' => $reinvestmentUsd,
            'profit_usd' => $profitUsd,
            'discount_bs' => $request->validated('discount_bs'),
            'tasa_bcv' => $tasaBcv, // <- usa la variable, no el request
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

    public function destroy(Sale $sale)
    {
        DB::beginTransaction();

        try {
            // Reversión e incremento del inventario original
            $currentItems = $sale->items()->with('product')->get();
            foreach ($currentItems as $item) {
                if ($item->product) {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }
            }

            // Eliminar ítems y el ticket
            $sale->items()->delete();
            $sale->delete();

            DB::commit();

            return back()->with('success', 'Ticket #' . $sale->id . ' eliminado y stock devuelto con éxito.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Error al eliminar el ticket: ' . $e->getMessage()]);
        }
    }
}