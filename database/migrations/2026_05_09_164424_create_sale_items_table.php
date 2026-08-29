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
        Schema::create('sale_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('product_id')->nullable()->constrained()->nullOnDelete();

            // Preserva el nombre original si el producto cambia o se borra
            $table->string('product_name_snapshot');
            $table->decimal('quantity', 12, 3)->default(0);

            // Precios y Costos Unitarios
            $table->decimal('unit_price_usd', 10, 2);
            $table->decimal('unit_price_bs', 12, 2);
            $table->decimal('unit_cost_usd', 10, 2);
            $table->decimal('unit_cost_bs', 12, 2);

            // Totales del ítem en USD
            $table->decimal('subtotal_usd', 10, 2);
            $table->decimal('cost_usd', 10, 2);
            $table->decimal('margin_usd', 10, 2); // subtotal_usd - cost_usd

            // Totales del ítem en Bs (usando la tasa histórica de la venta)
            $table->decimal('subtotal_bs', 12, 2);
            $table->decimal('cost_bs', 12, 2);
            $table->decimal('margin_bs', 12, 2); // subtotal_bs - cost_bs

            // Porcentaje y Distribución calculada al momento del cobro (Snapshot)
            $table->decimal('profit_percentage', 5, 2); // Ej: 80.00 o 20.00
            $table->decimal('reinvestment_percentage', 5, 2); // Ej: 80.00 o 20.00

            $table->decimal('reinvestment_usd', 10, 2);
            $table->decimal('profit_usd', 10, 2);

            $table->decimal('reinvestment_bs', 12, 2);
            $table->decimal('profit_bs', 12, 2);

            $table->timestamps();

            // Índices para consultas de inventario y reportes de productos más vendidos
            $table->index(['business_id', 'sale_id']);
            $table->index(['business_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
