<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class Supplier extends Model
{
    use SoftDeletes, BelongsToBusiness, HasUlids;

    /**
     * Atributos asignables masivamente.
     */
    protected $fillable = [
        'business_id',
        'name',
        'tax_type',
        'tax_id',
        'contact_name',
        'email',
        'phone',
        'address',
        'city',
        'notes',
        'is_active',
    ];

    /**
     * Casteo de atributos.
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];

    /* ==========================================
     | RELACIONES
     | ========================================== */

    /**
     * Negocio/Empresa al que pertenece el proveedor.
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * Reabastecimientos/Compras asociados a este proveedor.
     */
    public function restocks(): HasMany
    {
        return $this->hasMany(Restock::class);
    }

    /* ==========================================
     | SCOPES (Filtros de consulta útiles)
     | ========================================== */

    /**
     * Scope para obtener solo proveedores activos.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para filtrar proveedores por negocio.
     */
    public function scopeForBusiness(Builder $query, int $businessId): Builder
    {
        return $query->where('business_id', $businessId);
    }
}
