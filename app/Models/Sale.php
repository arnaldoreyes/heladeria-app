<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'total_bs',
        'total_usd',
        'cost_usd',
        'margin_usd',
        'reinvestment_usd',
        'profit_usd',
        'discount_bs', 
        'tasa_bcv',
        'payment_method',
        'change_loss_bs'
    ];

    protected $appends = ['transaction_code'];

    public function getTransactionCodeAttribute()
    {
        return 'TX-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}