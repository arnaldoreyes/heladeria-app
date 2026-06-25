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

        $price = $scraperService->getUsdRate();

        if ($price !== null && $price > 0) {
            Setting::updateOrCreate(['key' => 'last_bcv_rate'], ['value' => $price]);
            
            // Solo forzamos el modo auto si no estaba explícitamente en manual
            $currentMode = Setting::where('key', 'bcv_mode')->value('value');
            if ($currentMode !== 'manual') {
                Setting::updateOrCreate(['key' => 'bcv_mode'], ['value' => 'auto']);
            }
            
            Cache::forget('tasa_bcv_global');
            
            $this->info("Tasa actualizada exitosamente: {$price} Bs.");
            return Command::SUCCESS;
        }

        $this->error('Fallo al extraer la tasa del BCV.');
        return Command::FAILURE;
    }
}