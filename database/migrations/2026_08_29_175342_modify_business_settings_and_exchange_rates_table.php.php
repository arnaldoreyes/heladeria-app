<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Modificar la tabla exchange_rates
        Schema::table('exchange_rates', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'type', 'is_current']);
            $table->dropColumn('is_current');

            $table->foreignUlid('business_id')->nullable()->change();

            $table->foreignUlid('user_id')
                ->nullable()
                ->after('business_id')
                ->constrained()
                ->nullOnDelete();

            $table->enum('source', ['system_cron', 'system_sync', 'manual'])
                ->default('system_cron')
                ->after('rate');

            $table->index(['type', 'effective_at']);
            $table->index(['business_id', 'type', 'effective_at']);
        });

        // 2. Limpiar la tabla business_settings
        Schema::table('business_settings', function (Blueprint $table) {
            $table->dropColumn([
                'last_bcv_rate',
                'bcv_manual_rate',
                'bcv_last_updated_at',
            ]);
        });
    }

    public function down(): void
    {
        // Revertir cambios en business_settings
        Schema::table('business_settings', function (Blueprint $table) {
            $table->decimal('last_bcv_rate', 10, 4)->default(1.0000)->after('bcv_mode');
            $table->decimal('bcv_manual_rate', 10, 4)->default(0.0000)->after('last_bcv_rate');
            $table->timestamp('bcv_last_updated_at')->nullable()->after('bcv_manual_rate');
        });

        // Revertir cambios en exchange_rates
        Schema::table('exchange_rates', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'source']);
            $table->dropIndex(['type', 'effective_at']);
            $table->dropIndex(['business_id', 'type', 'effective_at']);

            $table->boolean('is_current')->default(true)->after('effective_at');
            $table->index(['business_id', 'type', 'is_current']);
        });
    }
};