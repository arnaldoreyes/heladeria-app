<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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
            $table->string('value')->nullable(); 
            $table->timestamps();
        });
        
        DB::table('settings')->insert([
            ['key' => 'last_bcv_rate', 'value' => '1'], 
            ['key' => 'bcv_mode', 'value' => 'auto'], 
            ['key' => 'bcv_manual_rate', 'value' => '0'],
            ['key' => 'profit_percentage', 'value' => '40'],
            ['key' => 'business_percentage', 'value' => '60'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};