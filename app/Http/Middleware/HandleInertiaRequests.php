<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Cache; 
use Illuminate\Support\Facades\Http;
use App\Models\Setting;
use App\Services\BcvScraperService;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $settings = Setting::whereIn('key', ['bcv_mode', 'bcv_manual_rate', 'last_bcv_rate', 'profit_percentage', 'business_percentage'])
                           ->pluck('value', 'key')->toArray();

        $mode = $settings['bcv_mode'] ?? 'auto';
        $manualRate = (float) ($settings['bcv_manual_rate'] ?? 0);
        $profitPercentage = (float) ($settings['profit_percentage'] ?? 40);
        $businessPercentage = (float) ($settings['business_percentage'] ?? 60);

        if ($mode === 'manual' && $manualRate > 0) {
            $tasaFinal = $manualRate;
        } else {
            // Lógica Auto con TU PROPIO SCRAPER (Cacheado por 2 horas)
            $tasaFinal = Cache::remember('tasa_bcv_global', now()->addHours(2), function () use ($settings) {
                // Instanciamos nuestro servicio
                $scraper = new BcvScraperService();
                $price = $scraper->getUsdRate();
                
                if ($price !== null && $price > 0) {
                    Setting::updateOrCreate(['key' => 'last_bcv_rate'], ['value' => $price]);
                    return $price;
                }
                
                // Si falla el scraping, devuelve la última tasa guardada
                return (float) ($settings['last_bcv_rate'] ?? 1); 
            });
        }

        return [
            ...parent::share($request),
            // Variables Inyectadas Globalmente (Accedibles en cualquier .jsx via usePage().props)
            'tasa_bcv' => $tasaFinal,
            'bcv_mode' => $mode,
            'profit_percentage' => $profitPercentage,
            'business_percentage' => $businessPercentage,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}