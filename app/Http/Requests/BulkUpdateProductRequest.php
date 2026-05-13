<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => 'required|array',
            'ids.*' => 'exists:products,id', // Buena práctica: valida que cada ID del array realmente exista
            'price_bs' => 'nullable|numeric|min:0',
            'price_usd' => 'nullable|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
        ];
    }
}