<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasUlids, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'user_id',
        'concept',
        'category',
        'amount_usd',
        'amount_bs',
        'exchange_rate',
        'exchange_rate_date',
        'payment_method',
        'expense_date',
        'notes',
    ];

    protected $casts = [
        'amount_usd' => 'decimal:2',
        'amount_bs' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'exchange_rate_date' => 'datetime',
        'expense_date' => 'date',
    ];

    protected static function booted(): void
    {
        static::saving(function (Expense $expense) {
            // Asigna el usuario autenticado si no está seteado
            if (empty($expense->user_id) && auth()->check()) {
                $expense->user_id = auth()->id();
            }

            // Asigna fecha de la tasa de cambio por defecto si no viene
            if (empty($expense->exchange_rate_date)) {
                $expense->exchange_rate_date = now();
            }

            // Recálculo automático cruzado si falta alguno de los dos montos
            if ($expense->exchange_rate > 0) {
                if (($expense->amount_usd > 0) && (empty($expense->amount_bs) || $expense->amount_bs == 0)) {
                    $expense->amount_bs = round($expense->amount_usd * $expense->exchange_rate, 2);
                } elseif (($expense->amount_bs > 0) && (empty($expense->amount_usd) || $expense->amount_usd == 0)) {
                    $expense->amount_usd = round($expense->amount_bs / $expense->exchange_rate, 2);
                }
            }
        });
    }

    // --- Relaciones ---

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // --- Scopes ---

    public function scopeByCategory(Builder $query, ?string $category): Builder
    {
        return $query->when($category, fn ($q) => $q->where('category', $category));
    }

    public function scopeByDateRange(Builder $query, ?string $startDate, ?string $endDate): Builder
    {
        return $query->when($startDate && $endDate, function ($q) use ($startDate, $endDate) {
            $q->whereBetween('expense_date', [$startDate, $endDate]);
        });
    }

    public function scopeByPaymentMethod(Builder $query, ?string $paymentMethod): Builder
    {
        return $query->when($paymentMethod, fn ($q) => $q->where('payment_method', $paymentMethod));
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('concept', 'LIKE', "%{$search}%")
                    ->orWhere('notes', 'LIKE', "%{$search}%");
            });
        });
    }
}
