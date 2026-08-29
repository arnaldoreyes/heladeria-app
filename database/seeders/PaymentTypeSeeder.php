<?php
namespace Database\Seeders;

use App\Models\PaymentType;
use App\Models\PaymentMethod;
use App\Models\Business;
use Illuminate\Database\Seeder;

class PaymentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Efectivo Divisas', 'code' => 'cash_usd', 'requires_reference' => false],
            ['name' => 'Efectivo Bolívares', 'code' => 'cash_bs', 'requires_reference' => false],
            ['name' => 'Pago Móvil', 'code' => 'pago_movil', 'requires_reference' => true],
            ['name' => 'Transferencia Bolívares', 'code' => 'transfer_bs', 'requires_reference' => true],
            ['name' => 'Transferencia Divisas', 'code' => 'transfer_usd', 'requires_reference' => true],
            ['name' => 'Zelle', 'code' => 'zelle', 'requires_reference' => true],
            ['name' => 'Binance', 'code' => 'binance', 'requires_reference' => true],
            ['name' => 'PayPal', 'code' => 'paypal', 'requires_reference' => true],
            ['name' => 'Punto de Venta', 'code' => 'pos', 'requires_reference' => true],
        ];

        foreach ($types as $typeData) {
            $typeData['is_active'] = true;
            PaymentType::firstOrCreate(['code' => $typeData['code']],$typeData);
        }
    }
}
