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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->decimal('value', 15, 4);
            $table->timestamps();
        });
        
        // Insertamos un valor inicial para que la app no nazca vacía
        DB::table('settings')->insert(['key' => 'last_bcv_rate', 'value' => 50.46]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
