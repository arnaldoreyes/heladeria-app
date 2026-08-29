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
        Schema::create('customers', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();

            // Datos de identificación (Solo 'name' es obligatorio para permitir registro rápido)
            $table->string('name');
            $table->string('type_document')->nullable(); // Cédula, RIF, DNI, Pasaporte
            $table->string('id_document')->nullable(); // Cédula, RIF, DNI, Pasaporte
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();

            // Control de crédito y límites
            $table->decimal('credit_limit_usd', 10, 2)->default(0); // 0 = Sin límite o crédito deshabilitado

            // Estado y observaciones
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable(); // Ej: "Paga los días 15", "Vecino del local"
            $table->softDeletes();
            $table->timestamps();

            // Índices multatenant para búsquedas rápidas en el POS y autocompletado
            $table->index(['business_id', 'is_active']);
            $table->index(['business_id', 'name']);
            $table->index(['business_id', 'id_document']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
