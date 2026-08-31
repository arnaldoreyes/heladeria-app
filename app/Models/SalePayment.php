<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalePayment extends Model
{
    use BelongsToBusiness, HasUlids;

    protected $fillable = [
        'business_id',
        'sale_id',
        'payment_method_id',
        'amount_original',
        'exchange_rate_date',
        'currency',
        'amount_usd',
        'exchange_rate',
        'reference',
        'notes',
    ];

    protected $casts = [
        'amount_original' => 'decimal:2',
        'amount_usd' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'exchange_rate_date' => 'datetime',
    ];

    // --- Relaciones ---
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function method(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    // --- Scopes Locales ---
    public function scopeByCurrency(Builder $query, string $currency): Builder
    {
        return $query->where('currency', strtoupper($currency));
    }

    public function scopeBySale(Builder $query, string $saleId): Builder
    {
        return $query->where('sale_id', $saleId);
    }
}
