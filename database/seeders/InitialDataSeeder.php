<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Crear las Categorías principales
        $categoriaTeta = Category::create(['name' => 'Teta', 'description' => 'Helados en bolsita']);
        $categoriaHelado = Category::create(['name' => 'Helado', 'description' => 'Helados tradicionales']);

        // 2. Lista de productos tipo "Teta"
        $saboresTeta = ['Choco Fresa', 'Chocolate', 'Mantecado', 'Ron con pasas', 'Uva', 'Coco'];

        // 3. Insertar cada producto en la base de datos
        foreach ($saboresTeta as $sabor) {
            Product::create([
                'category_id' => $categoriaTeta->id,
                'name' => $sabor,
                'price' => 300.00, // Precio base en Bs
                'stock' => 10,     // Un stock inicial de prueba
            ]);
        }
    }
}