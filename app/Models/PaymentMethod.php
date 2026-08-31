<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentMethod extends Model
{
    use HasUlids, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'payment_type_id',
        'name',
        'currency',
        'bank_name',
        'account_number',
        'phone_number',
        'id_document',
        'email',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // --- Relaciones ---

    public function type(): BelongsTo
    {
        return $this->belongsTo(PaymentType::class, 'payment_type_id');
    }

    // --- Scopes Locales ---

    public function scopeActive(Builder $query, bool|string|null $active = true): Builder
    {
        if (is_null($active)) {
            return $query;
        }

        return $query->where('is_active', filter_var($active, FILTER_VALIDATE_BOOLEAN));
    }

    public function scopeByCurrency(Builder $query, ?string $currency = null): Builder
    {
        return $query->when($currency, fn ($q) => $q->where('currency', strtoupper($currency)));
    }

    public function scopeByType(Builder $query, ?string $paymentTypeId = null): Builder
    {
        return $query->when($paymentTypeId, fn ($q) => $q->where('payment_type_id', $paymentTypeId));
    }

    public function scopeSearch(Builder $query, ?string $search = null): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('bank_name', 'LIKE', "%{$search}%")
                    ->orWhere('id_document', 'LIKE', "%{$search}%")
                    ->orWhere('phone_number', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%");
            });
        });
    }
}
