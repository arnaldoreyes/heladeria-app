<?php

namespace App\Services;

use Carbon\Carbon;
use DOMDocument;
use DOMXPath;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BcvScraperService
{
    /**
     * Realiza scraping a la página del BCV y retorna USD, EUR y Fecha Valor.
     *
     * @return array|null ['usd' => float, 'eur' => float, 'effective_date' => 'YYYY-MM-DD']
     */
    public function getRates(): ?array
    {
        try {
            $response = Http::withoutVerifying()
                ->timeout(12)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                ])
                ->get('https://www.bcv.org.ve/');

            if (!$response->successful()) {
                Log::warning('BCV Scraper: La petición a la página oficial no fue exitosa.');
                return null;
            }

            // Limitar a 500KB para proteger la memoria
            $html = substr($response->body(), 0, 500000);

            libxml_use_internal_errors(true);
            $dom = new DOMDocument();
            $dom->loadHTML($html, LIBXML_NOBLANKS | LIBXML_COMPACT);
            libxml_clear_errors();

            $xpath = new DOMXPath($dom);

            // 1. Extraer Tasas
            $usdRate = $this->extractRateByContainer($xpath, 'dolar');
            $eurRate = $this->extractRateByContainer($xpath, 'euro');

            // 2. Extraer Fecha Valor (ej: "Viernes, 04 Septiembre 2026")
            $dateNodes = $xpath->query('//span[@class="date-display-single"]');
            $rawDate = $dateNodes->length > 0 ? trim($dateNodes->item(0)->nodeValue) : '';
            $effectiveDate = $this->parseBcvDate($rawDate);

            if (!$usdRate) {
                Log::warning('BCV Scraper: No se pudo parsear el valor del USD.');
                return null;
            }

            return [
                'usd' => $usdRate,
                'eur' => $eurRate,
                'effective_date' => $effectiveDate ?? Carbon::today('America/Caracas')->format('Y-m-d'),
            ];

        } catch (Exception $e) {
            Log::error('BCV Scraper Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Mantiene compatibilidad directa para consultas simples.
     */
    public function getUsdRate(): ?float
    {
        $data = $this->getRates();
        return $data ? $data['usd'] : null;
    }

    /**
     * Extrae y limpia el valor numérico de un contenedor HTML (ej: id="dolar" o id="euro").
     */
    protected function extractRateByContainer(DOMXPath $xpath, string $containerId): ?float
    {
        $nodes = $xpath->query("//div[@id='{$containerId}']//div[contains(@class, 'centrado')]/strong");

        if ($nodes->length === 0) {
            return null;
        }

        $rawRate = trim($nodes->item(0)->nodeValue);
        $cleanRate = str_replace(',', '.', $rawRate);
        $cleanRate = preg_replace('/[^0-9.]/', '', $cleanRate);
        $floatRate = (float) $cleanRate;

        return ($floatRate > 1 && $floatRate < 10000) ? $floatRate : null;
    }

    /**
     * Parsea fechas en español del BCV a formato ISO (YYYY-MM-DD).
     */
    public function parseBcvDate(string $rawDate): ?string
    {
        if (empty($rawDate)) {
            return null;
        }

        $parts = explode(',', $rawDate);
        $datePart = count($parts) > 1 ? $parts[1] : $rawDate;
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
        
        return "{$year}-{$months[$monthName]}-{$day}";
    }
}