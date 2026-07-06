<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        // Not used directly, passed via ProductController/PosController
    }

    public function create()
    {
        //
    }

    public function store(StoreCategoryRequest $request)
    {
        Category::create($request->validated());
        return back()->with('success', 'Categoría creada con éxito');
    }

    public function show(Category $category)
    {
        //
    }

    public function edit(Category $category)
    {
        //
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());
        return back()->with('success', 'Categoría actualizada con éxito');
    }

    public function destroy(Category $category)
    {
        // Prevenir eliminación de la categoría por defecto (Helado, ID 1)
        if ($category->id === 1) {
            return back()->withErrors(['error' => 'No se puede eliminar la categoría principal.']);
        }

        // Mover productos a la categoría principal para evitar orfandad
        Product::where('category_id', $category->id)->update(['category_id' => 1]);

        $category->delete();
        return back()->with('success', 'Categoría eliminada con éxito');
    }
}
