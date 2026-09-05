<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\Customer;
use App\Models\PaymentType;
use App\Models\User;
use Illuminate\Support\Str;
use Carbon\Carbon;

class MigrateLegacyData extends Command
{
    protected $signature = 'app:migrate-v1';
    protected $description = 'Migra datos desde la base de datos v1 a la estructura v2';

    protected $mapUsers = [];
    protected $mapCategories = [];
    protected $mapProducts = [];
    protected $mapSales = [];
    protected $mapRestocks = [];

    protected $businessId = '';
    protected $paymentMethodsMap = [];

    public function handle()
    {
        $this->info('Iniciando migración de V1 a V2...');

        DB::transaction(function () {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            $this->createDefaultBusinessAndSettings();
            $this->migrateUsers();
            $this->migrateCategories();
            $this->migrateProducts();
            $this->setupDefaultPaymentMethods();
            $this->migrateSales();
            $this->migrateRestocks();
            $this->migrateExpenses();

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        });

        $this->info('¡Migración completada con éxito!');
    }

    protected function createDefaultBusinessAndSettings()
    {
        $this->info('Creando Negocio por defecto y configuraciones...');

        $this->businessId = (string) Str::ulid();

        DB::table('businesses')->insert([
            'id' => $this->businessId,
            'name' => 'Negocio Principal',
            'slug' => 'negocio-principal',
            'niche' => 'general',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $settingsV1 = DB::connection('mysql_v1')->table('settings')->pluck('value', 'key');

        DB::table('business_settings')->insert([
            'id' => (string) Str::ulid(),
            'business_id' => $this->businessId,
            'bcv_mode' => $settingsV1['bcv_mode'] ?? 'auto',
            'last_bcv_rate' => $settingsV1['last_bcv_rate'] ?? 1.0000,
            'bcv_manual_rate' => $settingsV1['bcv_manual_rate'] ?? 0.0000,
            'default_profit_percentage' => $settingsV1['profit_percentage'] ?? 40.00,
            'default_reinvestment_percentage' => $settingsV1['business_percentage'] ?? 60.00,
            'print_ticket_on_sale' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function migrateUsers()
    {
        $this->info('Migrando Usuarios...');
        $users = DB::connection('mysql_v1')->table('users')->cursor();
        $batch = [];

        foreach ($users as $user) {
            $ulid = (string) Str::ulid();
            $this->mapUsers[$user->id] = $ulid;

            $batch[] = [
                'id' => $ulid,
                'business_id' => $this->businessId,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'password' => $user->password,
                'remember_token' => $user->remember_token,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ];
        }

        if (!empty($batch)) DB::table('users')->insert($batch);
    }

    protected function migrateCategories()
    {
        $this->info('Migrando Categorías...');
        $categories = DB::connection('mysql_v1')->table('categories')->cursor();
        $batch = [];

        foreach ($categories as $cat) {
            $ulid = (string) Str::ulid();
            $this->mapCategories[$cat->id] = $ulid;

            $batch[] = [
                'id' => $ulid,
                'business_id' => $this->businessId,
                'name' => $cat->name,
                'description' => $cat->description,
                'icon' => $cat->icon ?? 'tag',
                'created_at' => $cat->created_at,
                'updated_at' => $cat->updated_at,
            ];
        }

        if (!empty($batch)) DB::table('categories')->insert($batch);
    }

    protected function migrateProducts()
    {
        $this->info('Migrando Productos...');
        $products = DB::connection('mysql_v1')->table('products')->cursor();
        $batch = [];

        foreach ($products as $prod) {
            $ulid = (string) Str::ulid();
            $this->mapProducts[$prod->id] = $ulid;

            $batch[] = [
                'id' => $ulid,
                'business_id' => $this->businessId,
                'category_id' => $this->mapCategories[$prod->category_id] ?? null,
                'name' => $prod->name,
                'price_usd' => $prod->price_usd,
                'cost_usd' => $prod->cost_usd,
                'stock' => $prod->stock,
                'image' => $prod->image,
                'is_active' => true,
                'created_at' => $prod->created_at,
                'updated_at' => $prod->updated_at,
            ];
        }

        if (!empty($batch)) array_map(fn($chunk) => DB::table('products')->insert($chunk), array_chunk($batch, 500));
    }

    protected function setupDefaultPaymentMethods()
    {
        $this->info('Configurando Tipos y Métodos de Pago base...');

        $methodsUsed = DB::connection('mysql_v1')
            ->table('sales')
            ->distinct()
            ->pluck('payment_method');

        // Optimización N+1: Extraer consultas fuera del bucle
        $paymentMovil = PaymentType::where('code', 'pago_movil')->first();
        $paymentCashBs = PaymentType::where('code', 'cash_bs')->first();

        $batch = [];

        foreach ($methodsUsed as $methodName) {
            $methodName = $methodName ?: 'Efectivo';
            $methodId = (string) Str::ulid();

            $isMovil = stripos($methodName, 'movil') !== false;

            $batch[] = [
                'id' => $methodId,
                'business_id' => $this->businessId,
                'payment_type_id' => $isMovil ? $paymentMovil->id : $paymentCashBs->id,
                'name' => $methodName,
                'currency' => ($isMovil || stripos($methodName, 'bs') !== false) ? 'BS' : 'USD',
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $this->paymentMethodsMap[$methodName] = $methodId;
        }

        if (!empty($batch)) DB::table('payment_methods')->insert($batch);
    }

    protected function migrateSales()
    {
        $this->info('Migrando Ventas y Sale Items...');

        $sales = DB::connection('mysql_v1')->table('sales')->cursor();

        // Estructuras para Batch Inserts y Tickets
        $salesBatch = [];
        $paymentsBatch = [];
        $itemsBatch = [];
        $ticketCounters = [];
        $userId = User::first()?->id;

        foreach ($sales as $sale) {
            $ulid = (string) Str::ulid();
            $this->mapSales[$sale->id] = $ulid;

            // Generación de Ticket en memoria
            $saleDate = Carbon::parse($sale->created_at);
            $prefix = 'TKT-' . $saleDate->format('Ym');

            if (!isset($ticketCounters[$prefix])) {
                $ticketCounters[$prefix] = 1;
            }

            $ticketNumber = $prefix . '-' . str_pad($ticketCounters[$prefix]++, 5, '0', STR_PAD_LEFT);

            $salesBatch[] = [
                'id' => $ulid,
                'business_id' => $this->businessId,
                'status' => 'completed',
                'user_id' => $userId,
                'ticket_number' => $ticketNumber, // Asignado directamente aquí
                'sale_type' => 'cash',
                'payment_status' => 'paid',
                'total_bs' => $sale->total_bs,
                'total_usd' => $sale->total_usd,
                'exchange_rate' => $sale->tasa_bcv > 0 ? $sale->tasa_bcv : 1,
                'exchange_rate_date' => $sale->updated_at,
                'discount_bs' => $sale->discount_bs ?? 0,
                'change_loss_bs' => $sale->change_loss_bs ?? 0,
                'cost_usd' => $sale->cost_usd ?? 0,
                'margin_usd' => $sale->margin_usd ?? 0,
                'reinvestment_usd' => $sale->reinvestment_usd ?? 0,
                'profit_usd' => $sale->profit_usd ?? 0,
                'created_at' => $sale->created_at,
                'updated_at' => $sale->updated_at,
            ];

            $methodName = $sale->payment_method ?: 'Efectivo';
            $paymentMethodId = $this->paymentMethodsMap[$methodName];
            $currency = (stripos($methodName, 'bs') !== false || stripos($methodName, 'movil') !== false) ? 'BS' : 'USD';

            $paymentsBatch[] = [
                'id' => (string) Str::ulid(),
                'business_id' => $this->businessId,
                'sale_id' => $ulid,
                'payment_method_id' => $paymentMethodId,
                'amount_original' => $currency === 'BS' ? $sale->total_bs : $sale->total_usd,
                'currency' => $currency,
                'amount_usd' => $sale->total_usd,
                'exchange_rate' => $sale->tasa_bcv > 0 ? $sale->tasa_bcv : 1,
                'exchange_rate_date' => $sale->updated_at,
                'created_at' => $sale->created_at,
                'updated_at' => $sale->updated_at,
            ];

            $items = DB::connection('mysql_v1')
                ->table('sale_items')
                ->where('sale_id', $sale->id)
                ->get();

            foreach ($items as $item) {
                $oldProduct = DB::connection('mysql_v1')->table('products')->find($item->product_id);

                $unitPriceBs = $item->quantity > 0 ? ($item->price_bs / $item->quantity) : 0;
                $tasa = $sale->tasa_bcv > 0 ? $sale->tasa_bcv : 1;
                $unitPriceUsd = $unitPriceBs / $tasa;
                $unitCostUsd = $item->quantity > 0 ? ($item->cost_usd / $item->quantity) : 0;
                $subtotalUsd = $unitPriceUsd * $item->quantity;

                $marginUsd = $subtotalUsd - $item->cost_usd;
                $marginBs = $marginUsd * $tasa;

                $profitPercentage = 40.00;
                $reinvestmentPercentage = 100 - $profitPercentage;

                $profitUsd = $marginUsd * ($profitPercentage / 100);
                $reinvestmentUsd = $marginUsd * ($reinvestmentPercentage / 100);
                $profitBs = $marginBs * ($profitPercentage / 100);
                $reinvestmentBs = $marginBs * ($reinvestmentPercentage / 100);

                $itemsBatch[] = [
                    'id' => (string) Str::ulid(),
                    'business_id' => $this->businessId,
                    'sale_id' => $ulid,
                    'product_id' => $item->product_id ? ($this->mapProducts[$item->product_id] ?? null) : null,
                    'product_name_snapshot' => $oldProduct ? $oldProduct->name : 'Producto Eliminado',
                    'quantity' => $item->quantity,
                    'unit_price_usd' => $unitPriceUsd,
                    'unit_price_bs' => $unitPriceBs,
                    'unit_cost_usd' => $unitCostUsd,
                    'unit_cost_bs' => $unitCostUsd * $tasa,
                    'subtotal_usd' => $subtotalUsd,
                    'cost_usd' => $item->cost_usd,
                    'margin_usd' => $marginUsd,
                    'subtotal_bs' => $item->price_bs,
                    'cost_bs' => $item->cost_usd * $tasa,
                    'margin_bs' => $marginBs,
                    'profit_percentage' => $profitPercentage,
                    'reinvestment_percentage' => $reinvestmentPercentage,
                    'reinvestment_usd' => $reinvestmentUsd,
                    'profit_usd' => $profitUsd,
                    'reinvestment_bs' => $reinvestmentBs,
                    'profit_bs' => $profitBs,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ];
            }

            // Inserción en bloques de 500 registros para evitar agotar la memoria
            if (count($salesBatch) >= 500) {
                DB::table('sales')->insert($salesBatch);
                DB::table('sale_payments')->insert($paymentsBatch);
                DB::table('sale_items')->insert($itemsBatch);

                $salesBatch = [];
                $paymentsBatch = [];
                $itemsBatch = [];
            }
        }

        // Insertar los remanentes
        if (!empty($salesBatch)) {
            DB::table('sales')->insert($salesBatch);
            DB::table('sale_payments')->insert($paymentsBatch);

            // Los items pueden ser muchos más, los dividimos al final
            array_map(fn($chunk) => DB::table('sale_items')->insert($chunk), array_chunk($itemsBatch, 500));
        }
    }

    protected function migrateRestocks()
    {
        $this->info('Migrando Reposiciones...');
        $restocks = DB::connection('mysql_v1')->table('restocks')->cursor();

        foreach ($restocks as $restock) {
            $ulid = (string) Str::ulid();
            $this->mapRestocks[$restock->id] = $ulid;

            // En v1 no existía tasa explícita en restocks, calculamos una aproximada si se puede
            $tasa = ($restock->total_usd > 0) ? ($restock->total_bs / $restock->total_usd) : 1;

            DB::table('restocks')->insert([
                'id' => $ulid,
                'business_id' => $this->businessId,
                'status' => 'completed',
                'user_id' => User::first()?->id,
                'exchange_rate' => $tasa,
                'exchange_rate_date' => $restock->updated_at,
                'total_usd' => $restock->total_usd,
                'total_bs' => $restock->total_bs,
                'purchased_at' => $restock->created_at,
                'created_at' => $restock->created_at,
                'updated_at' => $restock->updated_at,
            ]);

            $items = DB::connection('mysql_v1')
                ->table('restock_items')
                ->where('restock_id', $restock->id)
                ->get();

            foreach ($items as $item) {
                $oldProduct = DB::connection('mysql_v1')->table('products')->find($item->product_id);
                $unitCostUsd = $item->quantity > 0 ? (($item->cost_usd ?? 0) / $item->quantity) : 0;

                DB::table('restock_items')->insert([
                    'id' => (string) Str::ulid(),
                    'restock_id' => $ulid,
                    'product_id' => $item->product_id ? ($this->mapProducts[$item->product_id] ?? null) : null,
                    'product_name_snapshot' => $oldProduct ? $oldProduct->name : 'Producto Eliminado',
                    'quantity' => $item->quantity,
                    'unit_cost_usd' => $unitCostUsd,
                    'unit_cost_bs' => $unitCostUsd * $tasa,
                    'subtotal_usd' => $item->cost_usd ?? 0,
                    'subtotal_bs' => ($item->cost_usd ?? 0) * $tasa,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ]);
            }
        }
    }

    protected function migrateExpenses()
    {
        $this->info('Migrando Gastos...');
        $expenses = DB::connection('mysql_v1')->table('expenses')->cursor();

        foreach ($expenses as $expense) {
            DB::table('expenses')->insert([
                'id' => (string) Str::ulid(),
                'user_id' => User::first()?->id,
                'business_id' => $this->businessId,
                'concept' => $expense->concept,
                'category' => $expense->category,
                'amount_usd' => $expense->amount_usd,
                'amount_bs' => $expense->amount_bs,
                'exchange_rate' => $expense->tasa_bcv ?? 1,
                'payment_method_id' => 'cash_usd', // Fallback global por defecto
                'expense_date' => $expense->expense_date,
                'created_at' => $expense->created_at,
                'updated_at' => $expense->updated_at,
            ]);
        }
    }
}
