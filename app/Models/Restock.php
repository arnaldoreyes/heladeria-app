<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Restock extends Model {
    protected $fillable = ['total_usd', 'total_bs'];
    protected $appends = ['transaction_code'];

    public function getTransactionCodeAttribute() {
        return 'FACT-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    public function items() {
        return $this->hasMany(RestockItem::class);
    }
}