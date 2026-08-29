<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_settings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            // Garantiza que cada negocio tenga exactamente un registro de configuración
            $table->foreignUlid('business_id')->unique()->constrained()->cascadeOnDelete();

            // Configuración de Tasa de Cambio (BCV / Paralelo / Manual)
            $table->enum('bcv_mode', ['auto', 'manual'])->default('auto');
            $table->decimal('last_bcv_rate', 10, 4)->default(1.0000);
            $table->decimal('bcv_manual_rate', 10, 4)->default(0.0000);
            $table->timestamp('bcv_last_updated_at')->nullable();

            // Distribución Financiera por Defecto (Fallback global)
            $table->decimal('default_profit_percentage', 5, 2)->default(40.00);
            $table->decimal('default_reinvestment_percentage', 5, 2)->default(60.00);

            // Opciones de Ticket / Impresión
            $table->boolean('print_ticket_on_sale')->default(true);
            $table->text('ticket_header_notes')->nullable();
            $table->text('ticket_footer_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_settings');
    }
};
