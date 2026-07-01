<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Cache; 
use Illuminate\Support\Facades\Http;
use App\Models\Setting;
use App\Services\BcvScraperService;
use Carbon\Carbon;

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
            // Lógica Auto con TU PROPIO SCRAPER (Expiración a medianoche o máx 2 horas)
            $now = Carbon::now('America/Caracas');
            $midnight = Carbon::tomorrow('America/Caracas');
            $ttl = max(60, $now->diffInSeconds($midnight));
            $ttl = min(7200, $ttl); // Máximo 2 horas de caché

            $tasaFinal = Cache::remember('tasa_bcv_global', $ttl, function () use ($settings) {
                $scraper = new BcvScraperService();
                
                // 1. Promover tasa futura programada si hoy ya es el día
                $scraper->promoteScheduledRateIfApplicable();

                // 2. Intentar scraping para buscar actualizaciones
                $bcvData = $scraper->getUsdData();
                if ($bcvData !== null) {
                    $scraper->processAndStoreBcvData($bcvData);
                }

                // 3. Devolver la tasa activa actual
                $currentRate = Setting::where('key', 'last_bcv_rate')->value('value');
                return (float) ($currentRate ?? $settings['last_bcv_rate'] ?? 1); 
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