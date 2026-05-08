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
        $table->id();
        // Esta línea conecta el producto con la categoría
        $table->foreignId('category_id')->constrained()->onDelete('cascade'); 
        
        $table->string('name');
        $table->decimal('price', 8, 2); // Hasta 8 dígitos en total, 2 decimales
        $table->integer('stock')->default(0);
        $table->string('image')->nullable();
        $table->timestamps();
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
