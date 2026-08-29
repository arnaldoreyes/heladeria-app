<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'product_id', 'user_id', 'type', 'quantity',
        'previous_stock', 'new_stock', 'reference_type', 'reference_id', 'notes'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'previous_stock' => 'integer',
        'new_stock' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reference()
    {
        return $this->morphTo(); // Polymorphic relationship para enlazar a un Sale o Restock
    }
}
