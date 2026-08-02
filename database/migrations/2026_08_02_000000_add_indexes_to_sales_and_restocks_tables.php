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
        // sales.created_at: sin índice, cualquier reporte por fecha/rango
        // hace table scan completo a medida que crece el historial de ventas.
        Schema::table('sales', function (Blueprint $table) {
            $table->index('created_at');
        });

        // restocks.created_at: índice normal. No resuelve por sí solo el
        // GROUP BY DATE_FORMAT() de ProductController (eso se aborda aparte,
        // con una columna generada), pero sí ayuda a cualquier otra query
        // que filtre restocks por rango de fechas sin envolver la columna
        // en una función.
        Schema::table('restocks', function (Blueprint $table) {
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });

        Schema::table('restocks', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });
    }
};