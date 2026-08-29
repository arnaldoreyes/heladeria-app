<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'type', 'rate', 'effective_at', 'is_current'
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'effective_at' => 'datetime',
        'is_current' => 'boolean',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
