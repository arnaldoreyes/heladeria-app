<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Subcategory extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'category_id', 'name', 'description',  'icon', 'profit_percentage', 'reinvestment_percentage'
    ];

    protected $casts = [
        'profit_percentage' => 'decimal:2',
        'reinvestment_percentage' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
