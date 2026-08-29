<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class BusinessSetting extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'bcv_mode', 'last_bcv_rate', 'bcv_manual_rate',
        'bcv_last_updated_at', 'default_profit_percentage',
        'default_reinvestment_percentage', 'print_ticket_on_sale',
        'ticket_header_notes', 'ticket_footer_notes'
    ];

    protected $casts = [
        'last_bcv_rate' => 'decimal:4',
        'bcv_manual_rate' => 'decimal:4',
        'default_profit_percentage' => 'decimal:2',
        'default_reinvestment_percentage' => 'decimal:2',
        'print_ticket_on_sale' => 'boolean',
        'bcv_last_updated_at' => 'datetime',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
