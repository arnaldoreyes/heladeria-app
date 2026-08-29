<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    use HasUlids;

    protected $fillable = [
        'name', 'slug', 'niche', 'status', 'logo_url'
    ];

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
}
