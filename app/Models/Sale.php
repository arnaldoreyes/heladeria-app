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

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}