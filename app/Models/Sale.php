<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = ['total_bs', 'total_usd', 'tasa_bcv'];

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}
