<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Restock extends Model
{
    use BelongsToBusiness, HasUlids;

    protected $fillable = [
        'business_id',
        'user_id',
        'supplier_name',
        'invoice_number',
        'status',
        'exchange_rate',
        'exchange_rate_date',
        'total_usd',
        'total_bs',
        'purchased_at',
        'notes',
    ];

    protected $casts = [
        'exchange_rate' => 'decimal:4',
        'exchange_rate_date' => 'datetime',
        'total_usd' => 'decimal:2',
        'total_bs' => 'decimal:2',
        'purchased_at' => 'datetime',
    ];

    // --- Relaciones ---
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RestockItem::class);
    }

    // --- Scopes Locales ---
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    public function scopeBySupplier(Builder $query, string $supplierName): Builder
    {
        return $query->where('supplier_name', 'LIKE', "%{$supplierName}%");
    }

    public function scopeByDateRange(Builder $query, mixed $startDate, mixed $endDate): Builder
    {
        return $query->whereBetween('purchased_at', [$startDate, $endDate]);
    }
}
