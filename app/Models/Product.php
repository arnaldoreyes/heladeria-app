<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'category_id', 'subcategory_id', 'sku', 'name',
        'price_usd', 'cost_usd', 'stock', 'min_stock_alert', 'image', 'is_active'
    ];

    protected $casts = [
        'price_usd' => 'decimal:2',
        'cost_usd' => 'decimal:2',
        'stock' => 'integer',
        'min_stock_alert' => 'integer',
        'is_active' => 'boolean',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }



    private static function generateUniqueSku($product)
    {
        // 1. Obtener un prefijo de la categoría (ej: CAT- o iniciales)
        $prefix = 'SKU';
        if ($product->category) {
            $prefix = strtoupper(Str::slug(substr($product->category->name, 0, 3)));
        }

        // 2. Buscar el último ID o correlativo numérico
        $lastId = self::max('id') + 1;

        // 3. Formatear con ceros a la izquierda (ej: CAT-00012)
        return sprintf('%s-%05d', $prefix, $lastId);
    }

     protected static function booted()
    {
        static::creating(function ($product) {
            if (empty($product->sku)) {
                $product->sku = self::generateUniqueSku($product);
            }
        });
    }
}
