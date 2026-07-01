<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Restock;
use App\Models\RestockItem;
use App\Models\User;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Crear el usuario Administrador para pruebas locales
        User::updateOrCreate(
            ['email' => 'admin@iceking.com'],
            [
                'name' => 'Administrador Ice King',
                'password' => Hash::make('password'),
            ]
        );

        // 2. Ejecutar la siembra de categorías y productos oficiales
        $this->call(InitialDataSeeder::class);

        // Obtener los productos creados
        $products = Product::all();
        if ($products->isEmpty()) {
            return;
        }

        // Definir fechas: desde hace 90 días hasta hoy
        $startDate = Carbon::now('America/Caracas')->subDays(90);
        $endDate = Carbon::now('America/Caracas');

        // Puntos de horas para simular picos de visitas
        $hoursPool = [
            11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 
            16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 
            18, 19, 19, 19, 20, 20, 21
        ];

        // 3. Loop día a día para simular compras y ventas
        for ($date = clone $startDate; $date->lte($endDate); $date->addDay()) {
            
            // Simular tasa oficial del BCV fluctuando y subiendo gradualmente
            $daysPassed = $startDate->diffInDays($date);
            $tasaBcv = 36.10 + ($daysPassed * 0.005) + (rand(-12, 12) / 100);

            // A. Simular un reabastecimiento (Restock) cada 10 días
            if ($date->day % 10 === 0) {
                $restockTime = (clone $date)->setTime(9, 0, 0);
                
                $restock = new Restock([
                    'total_usd' => 0,
                    'total_bs' => 0,
                ]);
                $restock->created_at = $restockTime;
                $restock->updated_at = $restockTime;
                $restock->save();

                $restockTotalUsd = 0;
                // Escoger de 4 a 8 productos aleatorios para reabastecer
                $restockProducts = $products->random(rand(4, 8));
                
                foreach ($restockProducts as $product) {
                    $quantity = rand(15, 40);
                    
                    $restockItem = new RestockItem([
                        'restock_id' => $restock->id,
                        'product_id' => $product->id,
                        'quantity' => $quantity,
                    ]);
                    $restockItem->created_at = $restockTime;
                    $restockItem->updated_at = $restockTime;
                    $restockItem->save();

                    // Costo mayorista estimado (60% del precio de venta al público)
                    $costPerUnitUsd = $product->price_usd * 0.60;
                    $restockTotalUsd += $costPerUnitUsd * $quantity;
                }

                $restock->update([
                    'total_usd' => $restockTotalUsd,
                    'total_bs' => $restockTotalUsd * $tasaBcv,
                ]);
            }

            // B. Simular ventas diarias
            $isWeekend = in_array($date->dayOfWeek, [Carbon::FRIDAY, Carbon::SATURDAY, Carbon::SUNDAY]);
            
            // Fines de semana venden mucho más
            $salesCount = $isWeekend ? rand(15, 28) : rand(4, 10);

            for ($i = 0; $i < $salesCount; $i++) {
                
                // Hora aleatoria según curva de demanda
                $hour = $hoursPool[array_rand($hoursPool)];
                $minute = rand(0, 59);
                $second = rand(0, 59);
                $createdAt = (clone $date)->setTime($hour, $minute, $second);

                // Método de pago: 50% Pago Móvil, 30% Divisas, 20% Efectivo Bs.
                $randPayment = rand(1, 10);
                if ($randPayment <= 5) {
                    $paymentMethod = 'Pago Movil';
                } elseif ($randPayment <= 8) {
                    $paymentMethod = 'Divisas';
                } else {
                    $paymentMethod = 'Efectivo';
                }

                // Generar ítems del carrito (1 a 3 productos distintos)
                $cartItemsCount = rand(1, 3);
                $chosenProducts = $products->random($cartItemsCount);

                $saleTotalUsd = 0;
                $itemsData = [];

                foreach ($chosenProducts as $product) {
                    $quantity = rand(1, 3);
                    $priceBs = $product->price_usd * $tasaBcv;
                    $saleTotalUsd += $product->price_usd * $quantity;

                    $itemsData[] = [
                        'product_id' => $product->id,
                        'quantity' => $quantity,
                        'price_bs' => $priceBs,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ];
                }

                $saleTotalBs = $saleTotalUsd * $tasaBcv;

                // Fuga cambiaria simulada (redondeo en Efectivo Bs) en 15% de casos
                $changeLossBs = 0;
                if ($paymentMethod === 'Efectivo' && rand(1, 10) > 8) {
                    $changeLossBs = (float) rand(2, 10); // Redondeo perdido de 2 a 10 Bs.
                }

                // Guardar la venta
                $sale = new Sale([
                    'total_bs' => $saleTotalBs,
                    'total_usd' => $saleTotalUsd,
                    'discount_bs' => 0,
                    'tasa_bcv' => $tasaBcv,
                    'payment_method' => $paymentMethod,
                    'change_loss_bs' => $changeLossBs,
                ]);
                $sale->created_at = $createdAt;
                $sale->updated_at = $createdAt;
                $sale->save();

                // Guardar ítems de la venta
                foreach ($itemsData as $itemData) {
                    $itemData['sale_id'] = $sale->id;
                    $saleItem = new SaleItem($itemData);
                    $saleItem->created_at = $createdAt;
                    $saleItem->updated_at = $createdAt;
                    $saleItem->save();
                }
            }
        }

        // 4. Asegurar stock final saludable en todos los productos para demostración
        foreach ($products as $product) {
            $product->update([
                'stock' => rand(25, 65),
            ]);
        }
    }
}
