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
        Schema::create('restocks', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete(); // Usuario que registró la orden

            $table->string('supplier_name')->nullable();
            $table->string('invoice_number')->nullable(); // Nro. de Factura / Control

            // Estado de la Reposición
            // draft = Presupuesto (No afecta stock)
            // completed = Compra realizada (Incrementa stock de los productos)
            // cancelled = Anulado
            $table->enum('status', ['draft', 'completed', 'cancelled'])->default('draft');

            // Tasa de cambio histórica fijada para esta reposición
            $table->decimal('exchange_rate', 10, 4);
            $table->timestamp('exchange_rate_date')->nullable();

            // Totales acumulados de la reposición
            $table->decimal('total_usd', 10, 2)->default(0);
            $table->decimal('total_bs', 12, 2)->default(0);

            $table->timestamp('purchased_at')->nullable(); // Fecha real de la factura de compra
            $table->text('notes')->nullable(); // Observaciones/Notas del pedido
            $table->timestamps();

            // Índices para reportes de compras por estado y negocio
            $table->index(['business_id', 'status']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restock_items');
        Schema::dropIfExists('restocks');
    }
};
