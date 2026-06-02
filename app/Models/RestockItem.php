<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class RestockItem extends Model {
    protected $fillable = ['restock_id', 'product_id', 'quantity'];
    public function product() {
        return $this->belongsTo(Product::class);
    }
}