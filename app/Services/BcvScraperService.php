<?php

namespace App\Services;

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
        try {
            // 1. Hacemos la petición a la página del BCV
            // Agregamos un User-Agent común para evitar bloqueos básicos
            $response = Http::withoutVerifying()
                ->timeout(10) // Damos 10 segundos porque la pág del BCV puede ser lenta
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                ])
                ->get('https://www.bcv.org.ve/');

            if (!$response->successful()) {
                return null;
            }

            $html = $response->body();

            // 2. Cargamos el HTML en el DOM parser de PHP
            // Suprimimos errores internos de HTML malformado con libxml_use_internal_errors
            libxml_use_internal_errors(true);
            $dom = new DOMDocument();
            $dom->loadHTML($html);
            libxml_clear_errors();

            // 3. Usamos XPath para buscar el elemento exacto.
            // Inspeccionando la página del BCV, el dólar suele estar en un div con id "dolar"
            $xpath = new DOMXPath($dom);
            
            // Buscamos el contenedor del Dólar y luego su valor
            $nodes = $xpath->query('//div[@id="dolar"]//div[contains(@class, "centrado")]/strong');

            if ($nodes->length > 0) {
                // 4. Extraemos el texto (ej: "  36,45670000  ")
                $rawRate = $nodes->item(0)->nodeValue;

                // 5. Limpieza rigurosa del dato:
                // a. Quitamos espacios en blanco
                $cleanRate = trim($rawRate);
                // b. Reemplazamos la coma decimal venezolana por un punto
                $cleanRate = str_replace(',', '.', $cleanRate);
                // c. Quitamos cualquier caracter que no sea número o punto
                $cleanRate = preg_replace('/[^0-9.]/', '', $cleanRate);

                $finalRate = (float) $cleanRate;

                // Verificación de cordura (sanity check)
                if ($finalRate > 1 && $finalRate < 5000) { 
                    return $finalRate;
                }
            }

            return null;

        } catch (Exception $e) {
            // Loguear el error si lo deseas: \Log::error('Error Scraping BCV: ' . $e->getMessage());
            return null;
        }
    }
}