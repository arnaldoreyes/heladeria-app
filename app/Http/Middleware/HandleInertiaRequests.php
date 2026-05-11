<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Cache; 
use Illuminate\Support\Facades\Http;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $tasaBcv = Cache::remember('tasa_bcv', now()->addHours(2), function () {
            try {
                // 1. Usamos la API activa y oficial de DolarApi
                $response = Http::withoutVerifying()
                                ->timeout(5)
                                ->get('https://ve.dolarapi.com/v1/dolares/oficial');
                
                if ($response->successful()) {
                    // DolarApi devuelve el precio en la llave 'promedio'
                    $price = (float) $response->json('promedio');
                    
                    if ($price > 0) {
                        // Guardamos el registro exitoso en la BD
                        \App\Models\Setting::updateOrCreate(
                            ['key' => 'last_bcv_rate'],
                            ['value' => $price]
                        );
                        
                        return $price;
                    }
                }
            } catch (\Exception $e) {
                // Ignorar error de red y pasar directamente a la Base de Datos
            }
            
            // 2. SI FALLA LA CONEXIÓN: La única fuente de la verdad es la Base de Datos.
            $lastSaved = \App\Models\Setting::where('key', 'last_bcv_rate')->first();
            
            // 3. Cero valores quemados. (Retornamos 1 como fail-safe absoluto para evitar división por cero en React)
            return $lastSaved && $lastSaved->value > 0 ? (float) $lastSaved->value : 1; 
        });

        return [
            ...parent::share($request),
            'tasa_bcv' => $tasaBcv,
        ];
    }
}
