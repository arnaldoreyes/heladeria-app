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
        // 1. Eliminar la relación y la columna subcategory_id en la tabla products
        if (Schema::hasColumn('products', 'subcategory_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropForeign(['subcategory_id']);
                $table->dropColumn('subcategory_id');
            });
        }

        // 2. Eliminar la tabla subcategories
        Schema::dropIfExists('subcategories');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Recrear la tabla subcategories
        Schema::create('subcategories', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->default('tag');
            $table->decimal('profit_percentage', 5, 2)->nullable();
            $table->decimal('reinvestment_percentage', 5, 2)->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        // 2. Volver a añadir la columna subcategory_id a products
        Schema::table('products', function (Blueprint $table) {
            $table->foreignUlid('subcategory_id')
                ->nullable()
                ->after('category_id')
                ->constrained('subcategories')
                ->nullOnDelete();
        });
    }
};
