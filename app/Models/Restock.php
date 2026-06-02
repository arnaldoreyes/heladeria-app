<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Restock extends Model {
    protected $fillable = ['total_usd', 'total_bs'];
    public function items() {
        return $this->hasMany(RestockItem::class);
    }
}