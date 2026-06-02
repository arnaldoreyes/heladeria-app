<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Http;
use App\Models\Setting;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Obtener la tasa dinámica oficial
        $tasaDinamica = 1; // Fail-safe absoluto por defecto
        
        try {
            $response = Http::withoutVerifying()
                            ->timeout(5)
                            ->get('https://ve.dolarapi.com/v1/dolares/oficial');
            
            if ($response->successful()) {
                $price = (float) $response->json('promedio');
                if ($price > 0) {
                    $tasaDinamica = $price;
                    
                    Setting::updateOrCreate(
                        ['key' => 'last_bcv_rate'],
                        ['value' => $tasaDinamica]
                    );
                }
            } else {
                $lastSaved = Setting::where('key', 'last_bcv_rate')->first();
                $tasaDinamica = $lastSaved && $lastSaved->value > 0 ? (float) $lastSaved->value : 1;
            }
        } catch (\Exception $e) {
            $lastSaved = Setting::where('key', 'last_bcv_rate')->first();
            $tasaDinamica = $lastSaved && $lastSaved->value > 0 ? (float) $lastSaved->value : 1;
        }

        // 2. Crear únicamente la categoría de Helados (Nacerá con ID 1 de forma natural)
        $categoriaHelado = Category::create([
            'name' => 'Helado',
            'description' => 'Helados tradicionales'
        ]);

        // 3. Lista de productos tipo "Helado" de la marca Cali
        $heladosTradicionales = [
            'Max Polet' => 2.00,
            'Polet Crunch White' => 2.00,
            'Avellana' => 3.00,
            'Polet triple Capita Frambuesa' => 3.00,
            'Polet triple Capita Arequipe' => 3.00,
            'Choco mani arequipe' => 1.00,
            'Choco mantecado' => 1.00,
            'Wonder' => 1.00,
            'Choco mani' => 1.00,
            'Super cono' => 1.50,
            'Mausi' => 1.00,
            'Paw Patrol' => 0.50,
            'Donut' => 1.00,
            'Cono Chicle' => 1.00,
            'Tinita Chocolate' => 1.00,
            'Tinita Mantecado' => 1.00,
            'Tinita Fresa' => 1.00,
            'Maxi Sandwich' => 1.20,
            'Fres limon' => 0.40,
            'Fres Fresa' => 0.40,
            'Pasion Fresa' => 0.60,
            'Pasion Parchita' => 0.60,
            'Casero Guanabana' => 0.60,
        ];

        // Insertar cada producto en la base de datos
        foreach ($heladosTradicionales as $nombre => $precioUsd) {
            Product::create([
                'category_id' => $categoriaHelado->id, // Dinámicamente usará el ID 1 generado
                'name' => $nombre,
                'price_usd' => $precioUsd,
                'price_bs' => $precioUsd * $tasaDinamica, 
                'stock' => 10,
            ]);
        }
    }
}