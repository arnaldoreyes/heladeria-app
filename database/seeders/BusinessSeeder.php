<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\BusinessSetting;
use Illuminate\Database\Seeder;

class BusinessSeeder extends Seeder
{
    public function run(): void
    {
        $business = Business::create([
            'name' => 'Mi Tienda Principal',
            'slug' => 'mi-tienda-principal',
            'status' => 'active',
        ]);

        BusinessSetting::create([
            'business_id' => $business->id,
            'bcv_mode' => 'auto',
            'last_bcv_rate' => 800.60,
            'bcv_manual_rate' => 800.60,
            'bcv_last_updated_at' => now(),
            'default_profit_percentage' => 40.00,
            'default_reinvestment_percentage' => 60.00,
            'print_ticket_on_sale' => true,
            'ticket_header_notes' => '¡Gracias por su compra!',
            'ticket_footer_notes' => 'Conserve este ticket para devoluciones.',
        ]);
    }
}
