<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class RestockItem extends Model
{
    use HasUlids;

    protected $fillable = [
        'restock_id', 'product_id', 'product_name_snapshot', 'quantity',
        'unit_cost_usd', 'unit_cost_bs', 'subtotal_usd', 'subtotal_bs'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost_usd' => 'decimal:2',
        'unit_cost_bs' => 'decimal:2',
        'subtotal_usd' => 'decimal:2',
        'subtotal_bs' => 'decimal:2',
    ];

    public function restock()
    {
        return $this->belongsTo(Restock::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
