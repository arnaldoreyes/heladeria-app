<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Setting;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $settings = Setting::whereIn('key', ['bcv_mode', 'profit_percentage', 'business_percentage'])
                           ->pluck('value', 'key')->toArray();

        $mode = $settings['bcv_mode'] ?? 'auto';
        $profitPercentage = (float) ($settings['profit_percentage'] ?? 40);
        $businessPercentage = (float) ($settings['business_percentage'] ?? 60);

        // Única fuente de verdad para la tasa operativa: CurrencyService.
        // No se reimplementa aquí para evitar dos escrituras con forma distinta
        // bajo la misma clave de caché 'tasa_bcv_global'.
        $tasaFinal = app(\App\Services\CurrencyService::class)->getCurrentRate();

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