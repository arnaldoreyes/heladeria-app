<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_types', function (Blueprint $table) {
            $table->ulid('id')->primary();
            // Nullable: si es NULL es un tipo global del sistema; si tiene ID, es personalizado de ese negocio
            $table->foreignUlid('business_id')->nullable()->constrained()->cascadeOnDelete();

            $table->string('name'); // Ej: "Pago Móvil", "Efectivo USD", "Zelle", "Criptomonedas", "Punto de Venta"
            $table->string('code'); // Ej: "pago_movil", "cash_usd", "zelle", "crypto", "card_pos"

            // Reglas operativas para el POS (Frontend)
            $table->boolean('requires_reference')->default(false); // Indica si el POS exige escribir num. de referencia
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['business_id', 'is_active']);
            $table->unique(['business_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_types');
    }
};
