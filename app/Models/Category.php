<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    // Permitir inserción masiva de estos campos
    protected $fillable = ['name', 'description'];

    // Relación: Una categoría tiene muchos productos
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}