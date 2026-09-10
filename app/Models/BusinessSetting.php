<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class BusinessSetting extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id',
        'bcv_mode',
        'default_profit_percentage',
        'default_reinvestment_percentage',
        'print_ticket_on_sale',
        'ticket_header_notes',
        'ticket_footer_notes',
        'currency_used',
        'rate_policy',
    ];

    protected function casts(): array
    {
        return [
            'default_profit_percentage'       => 'decimal:2',
            'default_reinvestment_percentage' => 'decimal:2',
            'print_ticket_on_sale'            => 'boolean',
        ];
    }
    // --- Relaciones ---
    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
