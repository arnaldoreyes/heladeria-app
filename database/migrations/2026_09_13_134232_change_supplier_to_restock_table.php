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
        Schema::table('restocks', function (Blueprint $table) {
            if (Schema::hasColumn('restocks', 'supplier_name')) {
                $table->dropColumn('supplier_name');
            }

            $table->foreignUlid('supplier_id')
                  ->nullable()
                  ->after('business_id') // Ubica la columna después de business_id (opcional)
                  ->constrained('suppliers')
                  ->nullOnDelete(); // Si se elimina el proveedor, la compra mantiene el registro pero pone el campo en null
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('restocks', function (Blueprint $table) {
            // Elimina la relación foránea y la columna supplier_id
            $table->dropForeign(['supplier_id']);
            $table->dropColumn('supplier_id');

            // Restaura la columna string original
            $table->string('supplier_name')->nullable();
        });
    }
};
