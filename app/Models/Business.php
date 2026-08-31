<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Business extends Model
{
    use HasUlids;

    protected $fillable = [
        'name', 'slug', 'niche', 'status', 'logo_url'
    ];

    // --- Relaciones ---
    public function settings()
    {
        return $this->hasOne(BusinessSetting::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function restocks()
    {
        return $this->hasMany(Restock::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function exchangeRates()
    {
        return $this->hasMany(ExchangeRate::class);
    }

    // --- Scopes Locales ---
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'LIKE', "%{$search}%")
              ->orWhere('slug', 'LIKE', "%{$search}%")
              ->orWhere('niche', 'LIKE', "%{$search}%");
        });
    }
}
