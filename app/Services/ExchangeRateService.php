<?php

namespace App\Services;

use App\Models\Business;
use App\Models\ExchangeRate;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;

class ExchangeRateService
{
    public function __construct(
        protected BcvScraperService $bcvScraper
    ) {}

    /**
     * Obtiene el estado actual consolidado para la UI/Dashboard.
     */
    public function getDashboardData(Business $business): array
    {
        $setting = $business->setting;

        $currentRate = $this->getActiveRateForBusiness($business);

        $history = ExchangeRate::whereNull('business_id')
            ->orWhere('business_id', $business->id)
            ->with('user:id,name')
            ->latest('effective_at')
            ->orderBy('id', 'desc')
            ->take(5)
            ->get();

        return [
            'current_rate'  => $currentRate,
            'history'       => $history,
            'bcv_mode'      => $setting?->bcv_mode ?? 'auto',
            'currency_used' => $setting?->currency_used ?? 'USD',
            'rate_policy'   => $setting?->rate_policy ?? 'smart',
        ];
    }

    /**
     * Determina la tasa operativa según el modo (manual/auto), moneda y política del negocio.
     */
    public function getActiveRateForBusiness(Business $business): ?ExchangeRate
    {
        $setting = $business->setting;

        $bcvMode  = $setting?->bcv_mode ?? 'auto';
        $currency = $setting?->currency_used ?? 'USD';
        $policy   = $setting?->rate_policy ?? 'strict';

        // 1. MODO MANUAL: Prioriza la última tasa manual del negocio o la global
        if ($bcvMode === 'manual') {
            return ExchangeRate::forBusiness($business->id)
                ->where('currency', $currency)
                ->latest('effective_at')
                ->first() 
                ?? ExchangeRate::global()->where('currency', $currency)->latest('effective_at')->first();
        }

        // 2. MODO AUTOMÁTICO
        $now = Carbon::now('America/Caracas');
        $today = $now->toDateString();
        $query = ExchangeRate::global()->where('currency', $currency);

        // Política Inmediata: Muestra siempre el último registro sin importar la fecha
        if ($policy === 'immediate') {
            return (clone $query)->latest('effective_at')->first();
        }

        // Política Inteligente con Feriados (smart_holiday)
        if ($policy === 'smart_holiday') {
            // Intenta buscar la tasa exacta del día de hoy
            $todayRate = (clone $query)->whereDate('effective_at', $today)->first();
            if ($todayRate) {
                return $todayRate;
            }

            // Si hoy es feriado o fin de semana (no hay tasa para hoy), busca la siguiente tasa futura cargada
            $futureRate = (clone $query)->where('effective_at', '>', $now)
                                        ->orderBy('effective_at', 'asc')
                                        ->first();
            if ($futureRate) {
                return $futureRate;
            }
        }

        // Política Estricta (strict) o fallback general para smart_holiday si no hay tasa futura cargada
        return (clone $query)->where('effective_at', '<=', $now)
                            ->latest('effective_at')
                            ->first();
    }

   /**
     * Sincroniza las tasas oficiales desde la web del BCV (USD, EUR) y crea/actualiza los registros GLOBALES.
     * 
     * @return ExchangeRate[]
     */
    public function syncFromBcv(?string $userId = null, string $source = 'system_sync'): array
    {
        $bcvData = $this->bcvScraper->getRates();

        if (!$bcvData) {
            throw new Exception('No se pudo obtener la información del portal del BCV.');
        }

        $supportedCurrencies = [
            'usd' => 'USD',
            'eur' => 'EUR',
        ];

        $effectiveAt = Carbon::parse($bcvData['effective_date'] . ' 00:00:00', 'America/Caracas');
        $syncedRates = [];

        DB::transaction(function () use ($bcvData, $supportedCurrencies, $effectiveAt, $userId, $source, &$syncedRates) {
            foreach ($supportedCurrencies as $key => $currencyCode) {
                if (empty($bcvData[$key])) {
                    continue;
                }

                $rawRate = str_replace(',', '.', (string) $bcvData[$key]);
                $rateValue = (float) $rawRate;

                $existing = ExchangeRate::global()
                    ->where('currency', $currencyCode)
                    ->where('effective_at', $effectiveAt)
                    ->first();

                if ($existing) {
                    $existing->update([
                        'rate'    => $rateValue,
                        'user_id' => $userId,
                        'source'  => $source,
                    ]);
                    $syncedRates[] = $existing;
                } else {
                    $syncedRates[] = ExchangeRate::create([
                        'business_id'  => null,
                        'user_id'      => $userId,
                        'type'         => 'bcv',
                        'currency'     => $currencyCode,
                        'rate'         => $rateValue,
                        'source'       => $source,
                        'effective_at' => $effectiveAt,
                    ]);
                }
            }
        });

        return $syncedRates;
    }

    /**
     * Actualiza la configuración en business_settings y registra la tasa manual si aplica.
     */
    public function updateConfig(
        Business $business,
        string $bcvMode,
        ?float $rate = null,
        ?string $userId = null,
        ?string $currencyUsed = null,
        ?string $ratePolicy = null
    ): void {
        DB::transaction(function () use ($business, $bcvMode, $rate, $userId, $currencyUsed, $ratePolicy) {
            // Guardar o actualizar en la tabla business_settings
            $business->setting()->updateOrCreate(
                ['business_id' => $business->id],
                array_filter([
                    'bcv_mode'      => $bcvMode,
                    'currency_used' => $currencyUsed ?? 'USD',
                    'rate_policy'   => $ratePolicy ?? 'smart',
                ], fn ($value) => !is_null($value))
            );

            // Si el modo es manual y enviaron un monto de tasa, la creamos
            if ($bcvMode === 'manual' && $rate !== null) {
                ExchangeRate::create([
                    'business_id'  => $business->id,
                    'user_id'      => $userId,
                    'type'         => 'bcv',
                    'currency'     => $currencyUsed ?? 'USD',
                    'rate'         => $rate,
                    'source'       => 'manual',
                    'effective_at' => now('America/Caracas'),
                ]);
            }
        });
    }
}