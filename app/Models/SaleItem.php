<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'sale_id', 'product_id', 'product_name_snapshot',
        'quantity', 'unit_price_usd', 'unit_price_bs', 'unit_cost_usd',
        'unit_cost_bs', 'subtotal_usd', 'cost_usd', 'margin_usd',
        'subtotal_bs', 'cost_bs', 'margin_bs', 'profit_percentage', 'reinvestment_percentage',
        'reinvestment_usd', 'profit_usd', 'reinvestment_bs', 'profit_bs'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price_usd' => 'decimal:2',
        'unit_price_bs' => 'decimal:2',
        'unit_cost_usd' => 'decimal:2',
        'unit_cost_bs' => 'decimal:2',
        'subtotal_usd' => 'decimal:2',
        'cost_usd' => 'decimal:2',
        'margin_usd' => 'decimal:2',
        'subtotal_bs' => 'decimal:2',
        'cost_bs' => 'decimal:2',
        'margin_bs' => 'decimal:2',
        'profit_percentage' => 'decimal:2',
        'reinvestment_percentage' => 'decimal:2',
        'reinvestment_usd' => 'decimal:2',
        'profit_usd' => 'decimal:2',
        'reinvestment_bs' => 'decimal:2',
        'profit_bs' => 'decimal:2',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
