<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ExchangeRate extends Model
{
    use BelongsToBusiness, HasUlids;

    protected $fillable = [
        'business_id',
        'type',
        'rate',
        'effective_at',
        'is_current',
    ];

    protected $casts = [
        'rate'         => 'decimal:4',
        'effective_at' => 'datetime',
        'is_current'   => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (ExchangeRate $exchangeRate) {
            if ($exchangeRate->is_current && ($exchangeRate->isDirty('is_current') || $exchangeRate->wasRecentlyCreated)) {
                DB::transaction(function () use ($exchangeRate) {
                    static::query()
                        ->where('business_id', $exchangeRate->business_id)
                        ->where('type', $exchangeRate->type)
                        ->where('id', '!=', $exchangeRate->id ?? '')
                        ->update(['is_current' => false]);
                });
            }
        });
    }

    // --- Scopes ---

    public function scopeCurrent(Builder $query, bool $isCurrent = true): Builder
    {
        return $query->where('is_current', $isCurrent);
    }

    public function scopeByType(Builder $query, ?string $type = null): Builder
    {
        return $query->when($type, fn ($q) => $q->where('type', $type));
    }

    public function scopeEffectiveOn(Builder $query, ?string $date = null): Builder
    {
        return $query->when($date, fn ($q) => $q->whereDate('effective_at', '<=', $date));
    }

    // --- Helpers ---

    public static function getActiveRate(string $type = 'BCV'): ?self
    {
        return static::query()
            ->byType($type)
            ->current()
            ->latest('effective_at')
            ->first();
    }
}
