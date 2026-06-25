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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('concept');
            $table->decimal('amount_usd', 10, 2);
            $table->decimal('amount_bs', 12, 2);
            $table->decimal('tasa_bcv', 10, 4)->nullable(); // Tasa vigente en el momento del gasto
            $table->date('expense_date');
            $table->string('category')->default('Operativo'); // Insumos, Servicios, Nómina, etc.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};