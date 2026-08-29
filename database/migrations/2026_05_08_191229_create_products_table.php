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
        Schema::create('products', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('category_id')->constrained()->onDelete('restrict');
            $table->foreignUlid('subcategory_id')->nullable()->constrained()->nullOnDelete();

            $table->string('sku')->nullable();
            $table->string('name');
            $table->decimal('price_usd', 10, 2); // Fuente única de verdad para el precio
            $table->decimal('cost_usd', 10, 2)->default(0);
            $table->decimal('stock', 12, 3)->default(0);
            $table->decimal('min_stock_alert', 12, 3)->default(5);
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Índice para optimizar búsquedas por empresa y SKU/Nombre
            $table->index(['business_id', 'sku']);
            $table->index(['business_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
