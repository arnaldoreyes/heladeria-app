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
        Schema::table('users', function (Blueprint $table) {
            // Se coloca después del 'id' y se permite NULL para usuarios Superadmin globales
            $table->foreignUlid('business_id')
                  ->nullable()
                  ->after('id')
                  ->constrained('businesses')
                  ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Elimina la clave foránea y luego la columna al hacer rollback
            $table->dropForeign(['business_id']);
            $table->dropColumn('business_id');
        });
    }
};
