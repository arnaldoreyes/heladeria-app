<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'payment_type_id', 'name', 'currency', 'bank_name',
        'account_number', 'phone_number', 'id_document', 'email', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function type()
    {
        return $this->belongsTo(PaymentType::class, 'payment_type_id');
    }
}
