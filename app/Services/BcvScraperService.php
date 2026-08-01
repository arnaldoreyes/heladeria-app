<?php

namespace App\Services;

use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use DOMDocument;
use DOMXPath;
use Exception;

class BcvScraperService
{
    /**
     * Hace scraping a la página del BCV y retorna el valor oficial del USD como float.
     *
     * @return float|null
     */
    public function getUsdRate(): ?float
    {
        $data = $this->getUsdData();
        return $data ? $data['rate'] : null;
    }

    /**
     * Hace scraping a la página del BCV y retorna un array con la tasa y la fecha de vigencia.
     *
     * @return array|null ['rate' => float, 'date' => 'YYYY-MM-DD']
     */
    public function getUsdData(): ?array
    {
        try {
            // 1. Hacemos la petición a la página del BCV con User-Agent
            $response = Http::withoutVerifying()
                ->timeout(10) // 10 segundos de timeout
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                ])
                ->get('https://www.bcv.org.ve/');

            if (!$response->successful()) {
                return null;
            }

            $html = $response->body();

            // 2. Cargamos el HTML en el DOM parser de PHP
            libxml_use_internal_errors(true);
            $dom = new DOMDocument();
            $dom->loadHTML($html);
            libxml_clear_errors();

            $xpath = new DOMXPath($dom);
            
            // 3. Extraer la tasa del dólar (dentro del div #dolar)
            $rateNodes = $xpath->query('//div[@id="dolar"]//div[contains(@class, "centrado")]/strong');
            // 4. Extraer la fecha de vigencia (el primer span con la clase date-display-single)
            $dateNodes = $xpath->query('//span[@class="date-display-single"]');

            if ($rateNodes->length > 0) {
                $rawRate = $rateNodes->item(0)->nodeValue;
                $cleanRate = trim($rawRate);
                $cleanRate = str_replace(',', '.', $cleanRate);
                $cleanRate = preg_replace('/[^0-9.]/', '', $cleanRate);
                $finalRate = (float) $cleanRate;

                $rawDate = $dateNodes->length > 0 ? trim($dateNodes->item(0)->nodeValue) : '';
                $parsedDate = $this->parseBcvDate($rawDate);

                // Verificación de cordura
                if ($finalRate > 1 && $finalRate < 5000) { 
                    return [
                        'rate' => $finalRate,
                        'date' => $parsedDate ?? Carbon::today('America/Caracas')->format('Y-m-d'),
                    ];
                }
            }

            return null;

        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Parsea la fecha de vigencia de la página del BCV (en español) a formato ISO (YYYY-MM-DD).
     * Ejemplo: "Miércoles, 01 Julio  2026" -> "2026-07-01"
     */
    public function parseBcvDate(string $rawDate): ?string
    {
        if (empty($rawDate)) {
            return null;
        }

        // Quitar el día de la semana si existe (ej. todo lo antes de la coma)
        $parts = explode(',', $rawDate);
        $datePart = count($parts) > 1 ? $parts[1] : $rawDate;
        
        // Sanitizar espacios múltiples y espacios en blanco
        $datePart = trim(preg_replace('/\s+/', ' ', $datePart));
        
        $dateParts = explode(' ', $datePart);
        if (count($dateParts) < 3) {
            return null;
        }
        
        $day = str_pad($dateParts[0], 2, '0', STR_PAD_LEFT);
        $monthName = mb_strtolower($dateParts[1], 'UTF-8');
        $year = $dateParts[2];
        
        $months = [
            'enero' => '01', 'febrero' => '02', 'marzo' => '03', 'abril' => '04',
            'mayo' => '05', 'junio' => '06', 'julio' => '07', 'agosto' => '08',
            'septiembre' => '09', 'octubre' => '10', 'noviembre' => '11', 'diciembre' => '12'
        ];
        
        if (!isset($months[$monthName])) {
            return null;
        }
        
        $month = $months[$monthName];
        
        return "{$year}-{$month}-{$day}";
    }

    /**
     * Procesa la tasa y fecha obtenidas y actualiza la base de datos de manera diferida.
     * Si la tasa es de hoy, se activa inmediatamente; si es del futuro, se programa.
     */
    public function processAndStoreBcvData(array $bcvData): array
    {
        $rateValue = $bcvData['rate'];
        $rateDate = $bcvData['date'];
        $today = Carbon::today('America/Caracas')->format('Y-m-d');
        $lastRate = Setting::where('key', 'last_bcv_rate')->value('value');

        // Siempre guardamos la última tasa oficial leída del sitio del BCV para fines informativos
        Setting::updateOrCreate(['key' => 'bcv_latest_scraped_rate'], ['value' => $rateValue]);
        Setting::updateOrCreate(['key' => 'bcv_latest_scraped_date'], ['value' => $rateDate]);

        // Si la tasa es idéntica a la tasa activa actual, no hacemos nada y limpiamos
        if ($lastRate !== null && (float)$rateValue === (float)$lastRate) {
            Setting::whereIn('key', ['bcv_next_rate', 'bcv_next_date'])->delete();
            return ['status' => 'ignored_same', 'rate' => $rateValue, 'date' => $rateDate];
        }

        if ($rateDate <= $today) {
            Setting::updateOrCreate(['key' => 'last_bcv_rate'], ['value' => $rateValue]);
            // Limpiar programación futura
            Setting::whereIn('key', ['bcv_next_rate', 'bcv_next_date'])->delete();
            return ['status' => 'activated_today', 'rate' => $rateValue, 'date' => $rateDate];
        } else {
            // Si la tasa es futura (ej: lunes o martes publicado el viernes), se programa para mañana a las 12:01 am
            $activationDate = Carbon::tomorrow('America/Caracas')->format('Y-m-d');
            Setting::updateOrCreate(['key' => 'bcv_next_rate'], ['value' => $rateValue]);
            Setting::updateOrCreate(['key' => 'bcv_next_date'], ['value' => $activationDate]);
            return [
                'status' => 'scheduled_future',
                'rate' => $rateValue,
                'rate_date' => $rateDate,
                'date' => $activationDate
            ];
        }
    }

    /**
     * Verifica si hay una tasa programada que ya deba entrar en vigencia y la promueve.
     */
    public function promoteScheduledRateIfApplicable(): float
    {
        $nextRate = Setting::where('key', 'bcv_next_rate')->value('value');
        $nextDate = Setting::where('key', 'bcv_next_date')->value('value');
        $today = Carbon::today('America/Caracas')->format('Y-m-d');

        if ($nextRate !== null && $nextDate !== null && $today >= $nextDate) {
            // Promover
            Setting::updateOrCreate(['key' => 'last_bcv_rate'], ['value' => $nextRate]);
            // Borrar temporales
            Setting::whereIn('key', ['bcv_next_rate', 'bcv_next_date'])->delete();
            Cache::forget('tasa_bcv_global');
            return (float) $nextRate;
        }

        $lastRate = Setting::where('key', 'last_bcv_rate')->value('value');
        return (float) ($lastRate ?? 1.0);
    }
}