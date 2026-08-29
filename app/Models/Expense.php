<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'user_id', 'concept', 'category', 'amount_usd',
        'amount_bs', 'exchange_rate', 'exchange_rate_date',
        'payment_method', 'expense_date', 'notes'
    ];

    protected $casts = [
        'amount_usd' => 'decimal:2',
        'amount_bs' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'exchange_rate_date' => 'datetime',
        'expense_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
