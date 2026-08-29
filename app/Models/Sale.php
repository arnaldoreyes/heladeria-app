<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Sale extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'user_id', 'customer_id', 'ticket_number', 'status',
        'sale_type', 'payment_status', 'total_bs', 'total_usd', 'paid_usd',
        'pending_usd', 'exchange_rate', 'exchange_rate_date', 'discount_bs',
        'change_loss_bs', 'cost_usd', 'margin_usd', 'reinvestment_usd', 'profit_usd'
    ];

    protected $casts = [
        'total_bs' => 'decimal:2',
        'total_usd' => 'decimal:2',
        'paid_usd' => 'decimal:2',
        'pending_usd' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'exchange_rate_date' => 'datetime',
        'discount_bs' => 'decimal:2',
        'change_loss_bs' => 'decimal:2',
        'cost_usd' => 'decimal:2',
        'margin_usd' => 'decimal:2',
        'reinvestment_usd' => 'decimal:2',
        'profit_usd' => 'decimal:2',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments()
    {
        return $this->hasMany(SalePayment::class);
    }

    protected static function booted()
    {
        static::creating(function ($ticket) {
            if (empty($ticket->ticket_number)) {
                $ticket->ticket_number = self::generateUniqueTicketNumber();
            }
        });
    }

    public static function generateUniqueTicketNumber(): string
    {
        $prefix = 'TKT';
        $yearMonth = Carbon::now()->format('Ym'); // Ej: 202608

        // Usamos una transacción con bloqueo para evitar duplicados concurrentes
        return DB::transaction(function () use ($prefix, $yearMonth) {

            // Buscar el último ticket creado que empiece con el prefijo y año/mes actual
            $lastTicket = self::where('ticket_number', 'LIKE', "{$prefix}-{$yearMonth}-%")
                ->orderBy('id', 'desc')
                ->lockForUpdate() // Bloquea la fila temporalmente para asegurar concurrencia
                ->first();

            $nextSequence = 1;

            if ($lastTicket) {
                // Extraer el último número secuencial del string (ej: de "TKT-202608-00045" saca "45")
                $parts = explode('-', $lastTicket->ticket_number);
                $lastSequence = (int) end($parts);
                $nextSequence = $lastSequence + 1;
            }

            // Formatear con ceros a la izquierda (ej: 00001)
            $sequentialCode = str_pad($nextSequence, 5, '0', STR_PAD_LEFT);

            return "{$prefix}-{$yearMonth}-{$sequentialCode}";
        });
    }
}
