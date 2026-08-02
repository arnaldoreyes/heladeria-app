<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BcvScraperService;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class UpdateBcvRate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bcv:update-rate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Extrae la tasa del dólar desde el BCV y actualiza la base de datos';

    /**
     * Execute the console command.
     */
    public function handle(BcvScraperService $scraperService)
    {
        $this->info('Iniciando extracción de tasa del BCV...');

        // 1. Promover tasa programada si hoy ya es el día
        $activeRate = $scraperService->resolveOperativeRate();
        $this->info("Tasa activa actual en BD: {$activeRate} Bs.");

        // 2. Intentar scraping para buscar actualizaciones
        $bcvData = $scraperService->getUsdData();

        if ($bcvData !== null) {
            $result = $scraperService->processAndStoreBcvData($bcvData);
            
            // Solo forzamos el modo auto si no estaba explícitamente en manual
            $currentMode = Setting::where('key', 'bcv_mode')->value('value');
            if ($currentMode !== 'manual') {
                Setting::updateOrCreate(['key' => 'bcv_mode'], ['value' => 'auto']);
            }
            
            Cache::forget('tasa_bcv_global');
            
            if ($result['status'] === 'activated_today') {
                $this->info("Tasa de hoy activada inmediatamente: {$result['rate']} Bs.");
            } elseif ($result['status'] === 'scheduled_future') {
                $this->info("Tasa de {$result['rate']} Bs. programada para entrar en vigencia el {$result['date']}.");
            } else {
                $this->info("La tasa obtenida ({$result['rate']} Bs. para el {$result['date']}) no requiere cambios en este momento.");
            }

            return Command::SUCCESS;
        }

        $this->error('Fallo al extraer la tasa del BCV.');
        return Command::FAILURE;
    }
}