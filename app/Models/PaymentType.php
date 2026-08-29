<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class PaymentType extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'name', 'code', 'requires_reference', 'is_active'
    ];

    protected $casts = [
        'requires_reference' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function methods()
    {
        return $this->hasMany(PaymentMethod::class);
    }
}
