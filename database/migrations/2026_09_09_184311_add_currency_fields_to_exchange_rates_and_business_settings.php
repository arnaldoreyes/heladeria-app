<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Agregar columna 'currency' a la tabla exchange_rates
        Schema::table('exchange_rates', function (Blueprint $table) {
            if (!Schema::hasColumn('exchange_rates', 'currency')) {
                $table->string('currency', 3)->default('USD')->after('type');
            }
        });

        // 2. Agregar campos a la tabla business_settings
        Schema::table('business_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('business_settings', 'currency_used')) {
                $table->string('currency_used', 3)->default('USD');
            }

            if (!Schema::hasColumn('business_settings', 'rate_policy')) {
                $table->string('rate_policy', 20)->default('smart'); // 'smart' | 'strict'
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exchange_rates', function (Blueprint $table) {
            if (Schema::hasColumn('exchange_rates', 'currency')) {
                $table->dropColumn('currency');
            }
        });

        Schema::table('business_settings', function (Blueprint $table) {
            $columnsToDrop = array_filter(
                ['currency_used', 'rate_policy'], 
                fn ($col) => Schema::hasColumn('business_settings', $col)
            );

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};