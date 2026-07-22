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
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('cost_usd', 10, 2)->default(0)->after('price_usd');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('cost_usd', 10, 2)->default(0)->after('price_bs');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('cost_usd', 10, 2)->default(0)->after('total_usd');
            $table->decimal('margin_usd', 10, 2)->default(0)->after('cost_usd');
            $table->decimal('reinvestment_usd', 10, 2)->default(0)->after('margin_usd');
            $table->decimal('profit_usd', 10, 2)->default(0)->after('reinvestment_usd');
        });

        // Retroalimentar ventas históricas si existieran
        $businessPercentage = (float) (DB::table('settings')->where('key', 'business_percentage')->value('value') ?? 60);
        $profitPercentage = (float) (DB::table('settings')->where('key', 'profit_percentage')->value('value') ?? 40);

        // Actualizar cost_usd en sale_items desde productos
        DB::statement("
            UPDATE sale_items si
            JOIN products p ON si.product_id = p.id
            SET si.cost_usd = p.cost_usd
            WHERE si.cost_usd = 0
        ");

        // Recalcular desgloses en sales
        $sales = DB::table('sales')->get();
        foreach ($sales as $sale) {
            $itemsCost = DB::table('sale_items')
                ->where('sale_id', $sale->id)
                ->sum(DB::raw('cost_usd * quantity'));

            $totalCostUsd = (float) $itemsCost;
            $totalSalesUsd = (float) $sale->total_usd;
            $marginUsd = max(0, $totalSalesUsd - $totalCostUsd);
            $reinvestmentUsd = $marginUsd * ($businessPercentage / 100);
            $profitUsd = $marginUsd * ($profitPercentage / 100);

            DB::table('sales')->where('id', $sale->id)->update([
                'cost_usd' => $totalCostUsd,
                'margin_usd' => $marginUsd,
                'reinvestment_usd' => $reinvestmentUsd,
                'profit_usd' => $profitUsd,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('cost_usd');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('cost_usd');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['cost_usd', 'margin_usd', 'reinvestment_usd', 'profit_usd']);
        });
    }
};
