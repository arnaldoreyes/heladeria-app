<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('payment_type_id')->constrained('payment_types')->onDelete('restrict');

            $table->string('name'); // Ej: "Pago Móvil Banesco Principal", "Efectivo Caja 1", "Zelle - Cuenta Pedro"
            $table->string('currency', 5)->default('USD'); // USD, BS, USDT, EUR

            // Datos opcionales para mostrar al cliente o cajero
            $table->string('bank_name')->nullable();    // Banesco, Mercantil, Provincial
            $table->string('account_number')->nullable();
            $table->string('phone_number')->nullable();
            $table->string('id_document')->nullable();  // RIF / Cédula
            $table->string('email')->nullable();        // Zelle / Paypal / Binance ID

            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['business_id', 'payment_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
