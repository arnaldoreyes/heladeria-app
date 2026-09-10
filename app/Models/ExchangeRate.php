<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ExchangeRate extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'business_id',
        'user_id',
        'type',
        'rate',
        'source',
        'effective_at',
        'currency'
    ];

    protected function casts(): array
    {
        return [
            'rate'         => 'decimal:4',
            'effective_at' => 'datetime',
        ];
    }

    // --- RELACIONES ---

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // --- SCOPES ---

    /**
     * Tasa vigente a una fecha dada (por defecto ahora).
     */
    public function scopeEffective(Builder $query, ?string $date = null): Builder
    {
        return $query->where('effective_at', '<=', $date ?? now());
    }

    /**
     * Solo tasas globales (creadas por el cron o sincronización del sistema).
     */
    public function scopeGlobal(Builder $query): Builder
    {
        return $query->whereNull('business_id');
    }

    /**
     * Solo tasas asignadas a un negocio específico.
     */
    public function scopeForBusiness(Builder $query, string $businessId): Builder
    {
        return $query->where('business_id', $businessId);
    }

    /**
     * Filtrar por tipo de moneda/mercado (ej: 'bcv', 'parallel').
     */
    public function scopeOfType(Builder $query, string $type = 'bcv'): Builder
    {
        return $query->where('type', $type);
    }

    public function isGlobal(): bool
    {
        return is_null($this->business_id);
    }
}