<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();

            // Tipo de tasa (bcv, parallel, custom)
            $table->string('type')->default('bcv');
            $table->decimal('rate', 10, 4);

            // Fecha/Hora a la que entró en vigencia esta tasa
            $table->timestamp('effective_at');

            // Indicar si es la tasa activa actual para ese tipo
            $table->boolean('is_current')->default(true);

            $table->timestamps();

            $table->index(['business_id', 'type', 'is_current']);
            $table->index(['business_id', 'effective_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};
