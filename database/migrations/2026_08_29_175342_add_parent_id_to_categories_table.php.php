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
        Schema::table('categories', function (Blueprint $table) {
            // Se agrega parent_id como nullable para permitir categorías raíz (sin padre)
            $table->foreignUlid('parent_id')
                ->nullable()
                ->after('business_id')
                ->constrained('categories')
                ->nullOnDelete();

            // Índice para optimizar búsquedas por jerarquía
            $table->index(['business_id', 'parent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'parent_id']);
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
        });
    }
};
