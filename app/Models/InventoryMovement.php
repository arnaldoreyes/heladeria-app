<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InventoryMovement extends Model
{
    use HasUlids, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'product_id',
        'user_id',
        'type',
        'quantity',
        'previous_stock',
        'new_stock',
        'reference_type',
        'reference_id',
        'notes',
    ];

    protected $casts = [
        'quantity'       => 'decimal:3',
        'previous_stock' => 'decimal:3',
        'new_stock'      => 'decimal:3',
    ];

    protected static function booted(): void
    {
        static::creating(function (InventoryMovement $movement) {
            if (empty($movement->user_id) && auth()->check()) {
                $movement->user_id = auth()->id();
            }
        });

        // Garantizar inmutabilidad de la auditoría de inventario
        static::updating(function () {
            throw new \Exception('Los movimientos de inventario son inmutables y no pueden modificarse.');
        });

        static::deleting(function () {
            throw new \Exception('Los movimientos de inventario no pueden ser eliminados.');
        });
    }

    // --- Relaciones ---

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    // --- Scopes Locales ---

    public function scopeByType(Builder $query, ?string $type = null): Builder
    {
        return $query->when($type, fn ($q) => $q->where('type', $type));
    }

    public function scopeByProduct(Builder $query, ?string $productId = null): Builder
    {
        return $query->when($productId, fn ($q) => $q->where('product_id', $productId));
    }

    public function scopeByUser(Builder $query, ?string $userId = null): Builder
    {
        return $query->when($userId, fn ($q) => $q->where('user_id', $userId));
    }

    public function scopeStartDate(Builder $query, ?string $startDate = null): Builder
    {
        return $query->when($startDate, fn ($q) => $q->whereDate('created_at', '>=', $startDate));
    }

    public function scopeEndDate(Builder $query, ?string $endDate = null): Builder
    {
        return $query->when($endDate, fn ($q) => $q->whereDate('created_at', '<=', $endDate));
    }

    public function scopeByDateRange(Builder $query, ?string $startDate = null, ?string $endDate = null): Builder
    {
        return $query->when($startDate && $endDate, function ($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [$startDate, $endDate]);
        });
    }

    public function scopeSearch(Builder $query, ?string $search = null): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('notes', 'LIKE', "%{$search}%")
                    ->orWhereHas('product', fn ($p) => $p->where('name', 'LIKE', "%{$search}%")->orWhere('sku', 'LIKE', "%{$search}%"));
            });
        });
    }
}
