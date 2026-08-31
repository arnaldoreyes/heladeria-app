<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class Product extends Model
{
    use BelongsToBusiness, HasUlids;

    protected $fillable = [
        'business_id',
        'category_id',
        'sku',
        'name',
        'price_usd',
        'cost_usd',
        'stock',
        'min_stock_alert',
        'image',
        'is_active',
    ];

    protected $casts = [
        'price_usd'       => 'decimal:2',
        'cost_usd'        => 'decimal:2',
        'stock'           => 'decimal:3',
        'min_stock_alert' => 'decimal:3',
        'is_active'        => 'boolean',
    ];

    // --- Relaciones ---

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    // --- Scopes Locales ---

    public function scopeActive(Builder $query, bool|string|null $active = true): Builder
    {
        if (is_null($active)) {
            return $query;
        }

        return $query->where('is_active', filter_var($active, FILTER_VALIDATE_BOOLEAN));
    }

    public function scopeLowStock(Builder $query, bool|string|null $lowStock = true): Builder
    {
        if (is_null($lowStock) || ! filter_var($lowStock, FILTER_VALIDATE_BOOLEAN)) {
            return $query;
        }

        return $query->whereColumn('stock', '<=', 'min_stock_alert');
    }

    public function scopeByCategory(Builder $query, ?string $categoryId = null): Builder
    {
        return $query->when($categoryId, fn ($q) => $q->where('category_id', $categoryId));
    }

    public function scopeSearch(Builder $query, ?string $search = null): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('sku', 'LIKE', "%{$search}%");
            });
        });
    }

    // --- Ciclo de Vida ---

    protected static function booted(): void
    {
        static::creating(function (self $product) {
            if (empty($product->sku)) {
                $product->sku = self::generateUniqueSku($product);
            }
        });
    }

    // --- Generación de SKU Multi-tenant ---

    private static function generateUniqueSku(self $product): string
    {
        $prefix = 'SKU';

        if ($product->category_id) {
            $category = Category::find($product->category_id);
            if ($category) {
                $prefix = strtoupper(Str::slug(substr($category->name, 0, 3)));
            }
        }

        return DB::transaction(function () use ($prefix, $product) {
            $lastProduct = self::where('business_id', $product->business_id)
                ->where('sku', 'LIKE', "{$prefix}-%")
                ->orderBy('created_at', 'desc')
                ->lockForUpdate()
                ->first();

            $nextSequence = 1;

            if ($lastProduct) {
                $parts = explode('-', $lastProduct->sku);
                $lastSequence = (int) end($parts);
                if ($lastSequence > 0) {
                    $nextSequence = $lastSequence + 1;
                }
            }

            return sprintf('%s-%05d', $prefix, $nextSequence);
        });
    }
}
