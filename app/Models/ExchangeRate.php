<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ExchangeRate extends Model
{
    use HasUlids, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'type',
        'rate',
        'effective_at',
        'is_current',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'effective_at' => 'datetime',
        'is_current' => 'boolean',
    ];

    protected static function booted(): void
    {
        // Al crear o actualizar, si esta tasa se marca como activa (is_current = true),
        // se desmarcan las demás tasas del mismo tipo dentro del mismo negocio.
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

    public function scopeCurrent(Builder $query): Builder
    {
        return $query->where('is_current', true);
    }

    public function scopeByType(Builder $query, ?string $type): Builder
    {
        return $query->when($type, fn ($q) => $q->where('type', $type));
    }

    public function scopeEffectiveOn(Builder $query, $date): Builder
    {
        return $query->whereDate('effective_at', '<=', $date);
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
