<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use App\Services\BcvScraperService; // Importamos el servicio de scraping

class SettingController extends Controller
{
    // Mostrar la vista de configuración
    public function index()
    {
        $settings = Setting::pluck('value', 'key')->toArray();

        // Valores por defecto si la base de datos está vacía
        return Inertia::render('Settings/Index', [
            'config' => [
                'bcv_mode' => $settings['bcv_mode'] ?? 'auto',
                'bcv_manual_rate' => $settings['bcv_manual_rate'] ?? '',
                'profit_percentage' => $settings['profit_percentage'] ?? '40',
                'business_percentage' => $settings['business_percentage'] ?? '60',
                'last_bcv_rate' => $settings['last_bcv_rate'] ?? 1,
            ]
        ]);
    }

    // Actualizar configuración general
    public function update(Request $request)
    {
        $data = $request->validate([
            'bcv_mode' => 'required|in:auto,manual',
            'bcv_manual_rate' => 'nullable|numeric|min:0',
            'profit_percentage' => 'required|numeric|min:0|max:100',
            'business_percentage' => 'required|numeric|min:0|max:100',
        ]);

        // Validación cruzada para asegurar que sumen 100%
        if (($data['profit_percentage'] + $data['business_percentage']) !== 100) {
            return back()->withErrors(['percentages' => 'Los porcentajes deben sumar exactamente 100.']);
        }

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        // Si cambiamos de modo o tasa manual, borramos el caché de la tasa global para forzar recálculo
        Cache::forget('tasa_bcv_global');

        return back()->with('success', 'Configuración guardada exitosamente.');
    }

    /**
     * Forzar la actualización haciendo Scraping a la página oficial del BCV.
     */
    public function forceApiRefresh(BcvScraperService $scraperService)
    {
        // Usamos nuestro servicio dedicado para obtener la tasa y la fecha
        $bcvData = $scraperService->getUsdData();

        if ($bcvData !== null) {
            $result = $scraperService->processAndStoreBcvData($bcvData);
            
            Setting::updateOrCreate(['key' => 'bcv_mode'], ['value' => 'auto']);
            Cache::forget('tasa_bcv_global');
            
            if ($result['status'] === 'activated_today') {
                return back()->with('success', "¡Tasa de hoy ({$result['rate']} Bs.) actualizada exitosamente!");
            } elseif ($result['status'] === 'scheduled_future') {
                $formattedRateDate = \Carbon\Carbon::parse($result['rate_date'])->locale('es')->translatedFormat('l d \d\e F');
                $formattedActivationDate = \Carbon\Carbon::parse($result['date'])->locale('es')->translatedFormat('l d \d\e F');
                return back()->with('success', "¡Tasa de {$result['rate']} Bs. (valor {$formattedRateDate}) programada para activarse el {$formattedActivationDate} a las 12:01 am!");
            }

            return back()->with('success', '¡Tasa procesada con éxito!');
        }

        return back()->withErrors(['api_error' => 'No se pudo leer la tasa de la página del BCV. Intenta más tarde o usa el modo manual.']);
    }
}