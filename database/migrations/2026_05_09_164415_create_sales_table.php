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
        Schema::create('sales', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete();

            // Relación opcional en contado, pero OBLIGATORIA cuando sale_type = 'credit'
            $table->foreignUlid('customer_id')->nullable()->constrained()->nullOnDelete();

            $table->string('ticket_number')->nullable();
            $table->enum('status', ['completed', 'cancelled', 'refunded'])->default('completed');

            $table->enum('sale_type', ['cash', 'credit'])->default('cash');
            $table->enum('payment_status', ['paid', 'pending', 'partial'])->default('paid');

            // Totales consolidados de la venta
            $table->decimal('total_bs', 12, 2);
            $table->decimal('total_usd', 10, 2);

            // Montos adeudados (indexados en USD)
            $table->decimal('paid_usd', 10, 2)->default(0);
            $table->decimal('pending_usd', 10, 2)->default(0);

            // Tasa aplicada y la fecha exacta correspondiente a esa tasa
            $table->decimal('exchange_rate', 10, 4);
            $table->timestamp('exchange_rate_date')->nullable();

            // Ajustes de caja
            $table->decimal('discount_bs', 10, 2)->default(0);
            $table->decimal('change_loss_bs', 10, 2)->default(0);

            // Desglose analítico del valor del ticket al momento del cierre (Snapshot)
            $table->decimal('cost_usd', 10, 2)->default(0);
            $table->decimal('margin_usd', 10, 2)->default(0);
            $table->decimal('reinvestment_usd', 10, 2)->default(0);
            $table->decimal('profit_usd', 10, 2)->default(0);

            $table->timestamps();

            // Índices para optimización de reportes y búsquedas
            $table->index(['business_id', 'created_at']);
            $table->index(['business_id', 'status']);
            $table->index(['business_id', 'payment_status']); // Reportes de Cuentas por Cobrar
            $table->index(['business_id', 'customer_id']);   // Historial de compras por cliente
            $table->index(['business_id', 'ticket_number']); // Búsqueda rápida en POS
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
