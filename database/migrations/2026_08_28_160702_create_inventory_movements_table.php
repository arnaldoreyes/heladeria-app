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
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete(); // Quién hizo el movimiento

            // Tipo de movimiento
            // sale = Venta | restock = Compra/Reposición | adjustment = Ajuste manual / Merma | return = Devolución
            $table->enum('type', ['sale', 'restock', 'adjustment', 'return']);

            // Cantidad del movimiento (puede ser positiva o negativa)
            $table->integer('quantity'); // Ej: +10 (reposición), -2 (venta o ajuste por daño)

            // Snapshot para auditoría rápida
            $table->decimal('previous_stock', 12, 3); // Stock antes del movimiento
            $table->decimal('new_stock', 12, 3);      // Stock después del movimiento

            // Relación polimórfica u opcional al documento de origen (Sale, Restock, etc.)
            $table->nullableMorphs('reference'); // Crea reference_type y reference_id

            $table->string('notes')->nullable(); // Ej: "Producto roto durante limpieza" o "Ajuste por inventario físico"
            $table->timestamps();

            $table->index(['business_id', 'product_id']);
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
