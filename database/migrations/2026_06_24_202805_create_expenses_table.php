<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            // Multi-tenant y auditoría
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete(); // Quién registró el gasto

            $table->string('concept'); // Ej: "Pago de servicio de Internet", "Compra de bolsas"
            $table->string('category')->default('Operativo'); // Operativo, Servicios, Nómina, Mantenimiento, etc.

            // Montos y Tasa
            $table->decimal('amount_usd', 10, 2);
            $table->decimal('amount_bs', 12, 2);
            $table->decimal('exchange_rate', 10, 4);
            $table->timestamp('exchange_rate_date')->nullable();

            // Método de pago de donde salió el dinero (Crucial para cuadres de caja)
            $table->foreignUlid('payment_method_id')
                ->nullable()
                ->constrained('payment_methods')
                ->nullOnDelete();

            $table->date('expense_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Índice para reportes de gastos por rango de fecha y categoría
            $table->index(['business_id', 'expense_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
