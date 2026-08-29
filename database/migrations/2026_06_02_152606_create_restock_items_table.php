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
        Schema::create('restock_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('restock_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('product_id')->nullable()->constrained()->nullOnDelete();

            // Snapshot por si el producto es eliminado en el futuro
            $table->string('product_name_snapshot');

            $table->decimal('quantity', 12, 3);

            // Costos Unitarios
            $table->decimal('unit_cost_usd', 10, 2);
            $table->decimal('unit_cost_bs', 12, 2);

            // Subtotales del ítem (quantity * unit_cost)
            $table->decimal('subtotal_usd', 10, 2);
            $table->decimal('subtotal_bs', 12, 2);

            $table->timestamps();
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
