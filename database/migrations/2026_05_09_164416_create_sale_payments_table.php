<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_payments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('payment_method_id')->constrained('payment_methods')->onDelete('restrict');

            // Montos y tasa
            $table->decimal('amount_original', 12, 2); // Ej: 500.00 Bs o 10.00 USD
            $table->string('currency', 5);             // BS, USD, USDT
            $table->decimal('amount_usd', 10, 2);      // Valor normalizado a USD al momento del cobro
            $table->decimal('exchange_rate', 10, 4);   // Tasa de cambio aplicada
            $table->timestamp('exchange_rate_date')->nullable();

            $table->string('reference')->nullable();   // Num. de referencia o comprobante
            $table->string('notes')->nullable();       // Ej: "Pago parcial", "Dejó billete de $20"

            $table->timestamps();

            $table->index(['business_id', 'payment_method_id']);
            $table->index(['sale_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_payments');
    }
};
