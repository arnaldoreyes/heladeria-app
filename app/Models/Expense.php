<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'concept',
        'amount_usd',
        'amount_bs',
        'tasa_bcv',
        'expense_date',
        'category',
    ];

    protected $casts = [
        'expense_date' => 'date',
    ];
}