<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Traemos los productos junto con el nombre de su categoría
        $products = Product::with('category')->latest()->get();
        
        // Enviamos los datos a un componente de React llamado 'Products/Index'
        return Inertia::render('Products/Index', [
            'products' => $products
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
   public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id', // <-- Añadimos esta línea
        ]);

        Product::create($validated);

        return back()->with('success', 'Producto registrado exitosamente');
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        // 1. Validamos la data que viene de React
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0', // Recordar: Este es el precio en Bs
            'category_id' => 'required|exists:categories,id',
        ]);

        // 2. Actualizamos el producto en la BD
        $product->update($validated);

        // 3. Retornamos sin recargar la página
        return back()->with('success', 'Producto actualizado');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        // Eliminamos el producto de la base de datos
        $product->delete();

        // Retornamos a la vista actual sin recargar
        return back()->with('success', 'Producto eliminado correctamente');
    }

    // Eliminar varios productos a la vez
    public function bulkDestroy(\Illuminate\Http\Request $request)
    {
        $request->validate(['ids' => 'required|array']);
        \App\Models\Product::whereIn('id', $request->ids)->delete();
        
        return redirect()->back();
    }

    // Actualización masiva (Precio y/o Stock)
    public function bulkUpdate(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'price' => 'nullable|numeric|min:0',
            'stock' => 'nullable|integer|min:0'
        ]);
        
        $data = [];
        
        // Solo actualiza lo que el usuario haya llenado en el modal
        if ($request->filled('price')) {
            $data['price'] = $request->price;
        }
        if ($request->filled('stock')) {
            $data['stock'] = $request->stock;
        }

        if (!empty($data)) {
            \App\Models\Product::whereIn('id', $request->ids)->update($data);
        }

        return redirect()->back();
    }
}
