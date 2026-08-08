<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('bcv:update-rate')->dailyAt('16:00');
        $schedule->command('bcv:update-rate')->dailyAt('18:00');

        // Corre 7 días a la semana: solo promueve lo que ya está guardado,
        // no hace scraping. Precalienta la tasa antes de que abra la tienda.
        $schedule->call(fn () => app(\App\Services\CurrencyService::class)->getCurrentRate())
            ->dailyAt('00:05');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}