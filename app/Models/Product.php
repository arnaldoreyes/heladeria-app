<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    // Permitir inserción masiva de estos campos
    protected $fillable = ['category_id', 'name', 'price', 'stock', 'image'];

    // Relación: Un producto pertenece a una categoría
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}