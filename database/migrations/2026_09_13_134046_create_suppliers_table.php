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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->ulid('id')->primary();

            // Relación con la tabla de negocios / empresas
            $table->foreignUlid('business_id')
                  ->constrained('businesses')
                  ->cascadeOnDelete();

            // Información básica del proveedor
            $table->string('name');                          // Nombre o Razón Social
            $table->string('tax_type')->nullable();          // RIF / CI (Identificación Fiscal)
            $table->string('tax_id')->nullable();            // (Identificación Fiscal)
            $table->string('contact_name')->nullable();      // Persona de contacto
            $table->string('email')->nullable();             // Correo electrónico
            $table->string('phone')->nullable();             // Teléfono principal

            // Información adicional
            $table->text('address')->nullable();             // Dirección física
            $table->string('city')->nullable();              // Ciudad / Municipio
            $table->text('notes')->nullable();               // Notas internas o términos de pago

            // Estado y Auditoría
            $table->boolean('is_active')->default(true);     // Para deshabilitar proveedores sin borrarlos
            $table->timestamps();
            $table->softDeletes();                           // Recomendado para evitar pérdida histórica en compras

            // Índices para optimizar búsquedas por negocio
            $table->index(['business_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
