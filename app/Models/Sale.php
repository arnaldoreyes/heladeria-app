<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Sale extends Model
{
    use BelongsToBusiness, HasUlids;

    protected $fillable = [
        'business_id',
        'user_id',
        'customer_id',
        'ticket_number',
        'status',
        'sale_type',
        'payment_status',
        'total_bs',
        'total_usd',
        'paid_usd',
        'pending_usd',
        'exchange_rate',
        'exchange_rate_date',
        'discount_bs',
        'change_loss_bs',
        'cost_usd',
        'margin_usd',
        'reinvestment_usd',
        'profit_usd',
    ];

    protected $casts = [
        'total_bs'           => 'decimal:2',
        'total_usd'          => 'decimal:2',
        'paid_usd'           => 'decimal:2',
        'pending_usd'        => 'decimal:2',
        'exchange_rate'      => 'decimal:4',
        'exchange_rate_date' => 'datetime',
        'discount_bs'        => 'decimal:2',
        'change_loss_bs'     => 'decimal:2',
        'cost_usd'           => 'decimal:2',
        'margin_usd'         => 'decimal:2',
        'reinvestment_usd'   => 'decimal:2',
        'profit_usd'         => 'decimal:2',
    ];

    // --- Relaciones ---

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }

    // --- Scopes Locales ---

    public function scopeCompleted(Builder $query, bool|string|null $completed = true): Builder
    {
        if (is_null($completed) || ! filter_var($completed, FILTER_VALIDATE_BOOLEAN)) {
            return $query;
        }

        return $query->where('status', 'completed');
    }

    public function scopePaid(Builder $query, bool|string|null $paid = true): Builder
    {
        if (is_null($paid) || ! filter_var($paid, FILTER_VALIDATE_BOOLEAN)) {
            return $query;
        }

        return $query->where('payment_status', 'paid');
    }

    public function scopeToday(Builder $query, bool|string|null $today = true): Builder
    {
        if (is_null($today) || ! filter_var($today, FILTER_VALIDATE_BOOLEAN)) {
            return $query;
        }

        return $query->whereDate('created_at', Carbon::today());
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
        return $query->when($startDate && $endDate, fn ($q) => $q->whereBetween('created_at', [$startDate, $endDate]));
    }

    // --- Scopes para Tipos de Venta ---

    public function scopeCash(Builder $query): Builder
    {
        return $query->where('sale_type', 'cash');
    }

    public function scopeCredit(Builder $query): Builder
    {
        return $query->where('sale_type', 'credit');
    }

    // --- Scopes para Cuentas por Cobrar ---

    public function scopePendingPayment(Builder $query, bool|string|null $pending = true): Builder
    {
        if (is_null($pending) || ! filter_var($pending, FILTER_VALIDATE_BOOLEAN)) {
            return $query;
        }

        return $query->whereIn('payment_status', ['pending', 'partial']);
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', 'cancelled');
    }

    // --- Scopes de Búsqueda Rápida ---

    public function scopeByCustomer(Builder $query, ?string $customerId = null): Builder
    {
        return $query->when($customerId, fn ($q) => $q->where('customer_id', $customerId));
    }

    public function scopeSearchTicket(Builder $query, ?string $ticketNumber = null): Builder
    {
        return $query->when($ticketNumber, fn ($q) => $q->where('ticket_number', 'LIKE', "%{$ticketNumber}%"));
    }

    public function scopeSearch(Builder $query, ?string $search = null): Builder
    {
        return $query->when($search, fn ($q) => $q->where('ticket_number', 'LIKE', "%{$search}%"));
    }

    // --- Ciclo de Vida ---

    protected static function booted(): void
    {
        static::creating(function (self $sale) {
            if (empty($sale->ticket_number)) {
                $sale->ticket_number = self::generateUniqueTicketNumber($sale);
            }
        });
    }

    // --- Generación de Ticket Multi-tenant ---

    public static function generateUniqueTicketNumber(self $sale): string
    {
        $prefix = 'TKT';
        $yearMonth = Carbon::now()->format('Ym');

        return DB::transaction(function () use ($prefix, $yearMonth, $sale) {
            $lastTicket = self::where('business_id', $sale->business_id)
                ->where('ticket_number', 'LIKE', "{$prefix}-{$yearMonth}-%")
                ->orderBy('created_at', 'desc')
                ->lockForUpdate()
                ->first();

            $nextSequence = 1;

            if ($lastTicket) {
                $parts = explode('-', $lastTicket->ticket_number);
                $lastSequence = (int) end($parts);
                if ($lastSequence > 0) {
                    $nextSequence = $lastSequence + 1;
                }
            }

            $sequentialCode = str_pad((string) $nextSequence, 5, '0', STR_PAD_LEFT);

            return "{$prefix}-{$yearMonth}-{$sequentialCode}";
        });
    }
}
