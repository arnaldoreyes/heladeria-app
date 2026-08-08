<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Restock;
use App\Models\RestockItem;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Requests\BulkUpdateProductRequest;
use App\Http\Requests\BulkDestroyProductRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('category')->latest()->get();
        
        // Antes: 1 query de agregación (GROUP BY DATE_FORMAT, no indexable)
        // + 1 query adicional POR CADA MES de historial (N+1).
        // Ahora: 1 sola query total, sin importar cuántos meses existan.
        // Con el volumen de restocks de este negocio, traer todo y agrupar
        // en PHP es más barato que N idas y vueltas a la base de datos.
        $restockHistory = Restock::with('items.product')
            ->latest()
            ->get()
            ->groupBy(fn ($restock) => $restock->created_at->format('Y-m'))
            ->map(function ($restocksInMonth, $monthKey) {
                $date = Carbon::createFromFormat('Y-m', $monthKey)->locale('es');

                return [
                    'id' => $monthKey,
                    'month_name' => ucfirst($date->translatedFormat('F Y')),
                    'restocks_count' => $restocksInMonth->count(),
                    'total_usd' => (float) $restocksInMonth->sum('total_usd'),
                    'total_bs' => (float) $restocksInMonth->sum('total_bs'),
                    'restocks' => $restocksInMonth->values(),
                ];
            })
            ->sortKeysDesc()
            ->values();

        $categories = \App\Models\Category::all()->values();

        return inertia('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'restockHistory' => $restockHistory
        ]);
    }

    public function create()
    {
        //
    }

    // Inyectamos StoreProductRequest
    public function store(StoreProductRequest $request)
    {
        // $request->validated() devuelve solo la data limpia y segura
        Product::create($request->validated());

        return back()->with('success', 'Producto registrado exitosamente');
    }

    public function show(Product $product)
    {
        //
    }

    public function edit(Product $product)
    {
        //
    }

    // Inyectamos UpdateProductRequest
    public function update(UpdateProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        return back()->with('success', 'Producto actualizado');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return back()->with('success', 'Producto eliminado correctamente');
    }

    // Inyectamos BulkDestroyProductRequest
    public function bulkDestroy(BulkDestroyProductRequest $request)
    {
        Product::whereIn('id', $request->validated('ids'))->delete();
        
        return redirect()->back();
    }

    // Inyectamos BulkUpdateProductRequest
    public function bulkUpdate(BulkUpdateProductRequest $request)
    {
        $data = [];
        
        if ($request->filled('price_bs') && $request->filled('price_usd')) {
            $data['price_bs'] = $request->price_bs;
            $data['price_usd'] = $request->price_usd;
        }

        if ($request->filled('cost_usd')) {
            $data['cost_usd'] = $request->cost_usd;
        }
        
        if ($request->filled('stock')) {
            $data['stock'] = $request->stock;
        }

        if (!empty($data)) {
            Product::whereIn('id', $request->validated('ids'))->update($data);
        }

        return redirect()->back();
    }

    public function restock(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'total_usd' => 'required|numeric|min:0',
            'total_bs' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.cost_usd' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($request) {
            // 1. Guardar la factura global
            $restock = Restock::create([
                'total_usd' => $request->total_usd,
                'total_bs' => $request->total_bs,
            ]);

            // 2. Guardar el detalle, aumentar el stock y actualizar costo al mayor si cambió
            foreach ($request->items as $item) {
                RestockItem::create([
                    'restock_id' => $restock->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'cost_usd' => $item['cost_usd'] ?? null,
                ]);

                $product = Product::find($item['product_id']);
                if ($product) {
                    $updateData = [];
                    if (isset($item['cost_usd']) && is_numeric($item['cost_usd']) && $item['cost_usd'] >= 0) {
                        $updateData['cost_usd'] = $item['cost_usd'];
                    }
                    $product->increment('stock', $item['quantity'], $updateData);
                }
            }
        });

        return redirect()->back();
    }
}