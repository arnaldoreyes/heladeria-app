<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'name', 'type_document', 'id_document',
        'phone', 'email', 'address', 'credit_limit_usd',
        'is_active', 'notes'
    ];

    protected $casts = [
        'credit_limit_usd' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
