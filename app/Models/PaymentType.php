<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class PaymentType extends Model
{
    use HasUlids, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'name',
        'code',
        'requires_reference',
        'is_active',
    ];

    protected $casts = [
        'requires_reference' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (PaymentType $paymentType) {
            if ($paymentType->isDirty('code')) {
                $paymentType->code = Str::slug($paymentType->code, '_');
            }
        });
    }

    // --- Relaciones ---

    public function methods(): HasMany
    {
        return $this->hasMany(PaymentMethod::class);
    }

    // --- Scopes Locales ---

    public function scopeActive(Builder $query, bool $active = true): Builder
    {
        return $query->where('is_active', $active);
    }

    public function scopeByCode(Builder $query, ?string $code): Builder
    {
        return $query->when($code, fn ($q) => $q->where('code', Str::slug($code, '_')));
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('code', 'LIKE', "%{$search}%");
            });
        });
    }
}
