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
        'exchange_rate'      => 'decimal:4',
        'exchange_rate_date' => 'datetime',
        'total_usd'          => 'decimal:2',
        'total_bs'           => 'decimal:2',
        'purchased_at'       => 'datetime',
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

    public function scopeCompleted(Builder $query, bool|string|null $completed = true): Builder
    {
        if (is_null($completed) || ! filter_var($completed, FILTER_VALIDATE_BOOLEAN)) {
            return $query;
        }

        return $query->where('status', 'completed');
    }

    public function scopeBySupplier(Builder $query, ?string $supplierName = null): Builder
    {
        return $query->when($supplierName, fn ($q) => $q->where('supplier_name', 'LIKE', "%{$supplierName}%"));
    }

    public function scopeStartDate(Builder $query, ?string $startDate = null): Builder
    {
        return $query->when($startDate, fn ($q) => $q->whereDate('purchased_at', '>=', $startDate));
    }

    public function scopeEndDate(Builder $query, ?string $endDate = null): Builder
    {
        return $query->when($endDate, fn ($q) => $q->whereDate('purchased_at', '<=', $endDate));
    }

    public function scopeByDateRange(Builder $query, ?string $startDate = null, ?string $endDate = null): Builder
    {
        return $query->when($startDate && $endDate, fn ($q) => $q->whereBetween('purchased_at', [$startDate, $endDate]));
    }

    public function scopeSearch(Builder $query, ?string $search = null): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('supplier_name', 'LIKE', "%{$search}%")
                    ->orWhere('invoice_number', 'LIKE', "%{$search}%")
                    ->orWhere('notes', 'LIKE', "%{$search}%");
            });
        });
    }
}
