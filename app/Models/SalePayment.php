<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class SalePayment extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'sale_id', 'payment_method_id', 'amount_original', 'exchange_rate_date',
        'currency', 'amount_usd', 'exchange_rate', 'reference', 'notes'
    ];

    protected $casts = [
        'amount_original' => 'decimal:2',
        'amount_usd' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'exchange_rate_date' => 'datetime',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function method()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }
}
