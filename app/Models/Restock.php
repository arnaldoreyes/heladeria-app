<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Restock extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'user_id', 'supplier_name', 'invoice_number',
        'status', 'exchange_rate', 'exchange_rate_date', 'total_usd',
        'total_bs', 'purchased_at', 'notes'
    ];

    protected $casts = [
        'exchange_rate' => 'decimal:4',
        'exchange_rate_date' => 'datetime',
        'total_usd' => 'decimal:2',
        'total_bs' => 'decimal:2',
        'purchased_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(RestockItem::class);
    }
}
