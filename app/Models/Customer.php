<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use BelongsToBusiness, HasUlids;

    protected $fillable = [
        'business_id',
        'name',
        'type_document',
        'id_document',
        'phone',
        'email',
        'address',
        'credit_limit_usd',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'credit_limit_usd' => 'decimal:2',
        'is_active'        => 'boolean',
    ];

    // --- Accessors ---

    protected function fullDocument(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->type_document && $this->id_document
                ? "{$this->type_document}-{$this->id_document}"
                : $this->id_document
        );
    }

    // --- Relaciones ---

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    // --- Scopes ---

    public function scopeActive(Builder $query, bool $isActive = true): Builder
    {
        return $isActive
            ? $query->where('is_active', true)
            : $query->where('is_active', false);
    }

    public function scopeWithCredit(Builder $query, bool $hasCredit = true): Builder
    {
        return $hasCredit
            ? $query->where('credit_limit_usd', '>', 0)
            : $query->where(function ($q) {
                $q->whereNull('credit_limit_usd')->orWhere('credit_limit_usd', '<=', 0);
            });
    }

    public function scopeSearch(Builder $query, ?string $search = null): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('id_document', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%")
                    ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        });
    }
}
