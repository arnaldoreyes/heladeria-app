<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class CurrencyService
{
    public function __construct(private BcvScraperService $bcvScraper) {}

    /**
     * Única fuente de verdad para "cuál es la tasa operativa vigente ahora mismo",
     * ya sea modo manual o automático. Segura de llamar desde cualquier lugar
     * (middleware, controllers, comandos) sin depender de que un cron haya corrido.
     */
    public function getCurrentRate(): float
    {
        return Cache::remember('tasa_bcv_global', now()->addMinutes(5), function () {
            $settings = Setting::whereIn('key', ['bcv_mode', 'bcv_manual_rate'])
                ->pluck('value', 'key');

            $mode = $settings['bcv_mode'] ?? 'auto';
            $manualRate = (float) ($settings['bcv_manual_rate'] ?? 0);

            if ($mode === 'manual' && $manualRate > 0) {
                return $manualRate;
            }

            $resolved = $this->bcvScraper->resolveOperativeRate();

            return $resolved['rate'] > 0 ? $resolved['rate'] : 1.0;
        });
    }
}