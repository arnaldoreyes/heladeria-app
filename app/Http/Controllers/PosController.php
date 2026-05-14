<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(): Response
    {
        $products = Product::with('category')->where('stock', '>', 0)->get();

        return Inertia::render('POS/Index', [
            'products' => $products
        ]);
    }
}