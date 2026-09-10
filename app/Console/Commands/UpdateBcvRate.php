<?php

namespace App\Console\Commands;

use App\Services\ExchangeRateService;
use Exception;
use Illuminate\Console\Command;

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
    protected $description = 'Extrae las tasas oficiales del BCV (USD, EUR) y registra los récords globales en la base de datos';

    /**
     * Execute the console command.
     */
    public function handle(ExchangeRateService $exchangeRateService): int
    {
        $this->info('Iniciando sincronización automatizada de tasas BCV...');

        try {
            $rates = $exchangeRateService->syncFromBcv(userId: null, source: 'system_cron');

            if (empty($rates)) {
                $this->warn('No se obtuvo ninguna tasa desde el BCV.');
                return Command::FAILURE;
            }

            $this->info('Tasas sincronizadas correctamente.');

            $rows = array_map(fn ($rate) => [
                $rate->currency,
                number_format($rate->rate, 4, ',', '.'),
                $rate->effective_at->format('d/m/Y'),
                $rate->source,
            ], $rates);

            $this->table(
                ['Moneda', 'Tasa (Bs.)', 'Fecha Valor', 'Tipo/Origen'],
                $rows
            );

            return Command::SUCCESS;
        } catch (Exception $e) {
            $this->error("Error durante la sincronización: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }
}