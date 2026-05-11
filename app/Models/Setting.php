<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    // Le decimos a Laravel qué columnas se pueden llenar de forma masiva
    protected $fillable = [
        'key',
        'value',
    ];
}