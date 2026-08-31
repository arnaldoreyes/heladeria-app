<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestockItem extends Model
{
    use BelongsToBusiness, HasUlids;

    protected $fillable = [
        'business_id',
        'restock_id',
        'product_id',
        'product_name_snapshot',
        'quantity',
        'unit_cost_usd',
        'unit_cost_bs',
        'subtotal_usd',
        'subtotal_bs',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_cost_usd' => 'decimal:2',
        'unit_cost_bs' => 'decimal:2',
        'subtotal_usd' => 'decimal:2',
        'subtotal_bs' => 'decimal:2',
    ];

    // --- Relaciones ---
    public function restock(): BelongsTo
    {
        return $this->belongsTo(Restock::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // --- Scopes Locales ---
    public function scopeByRestock(Builder $query, string $restockId): Builder
    {
        return $query->where('restock_id', $restockId);
    }

    public function scopeByProduct(Builder $query, string $productId): Builder
    {
        return $query->where('product_id', $productId);
    }
}
