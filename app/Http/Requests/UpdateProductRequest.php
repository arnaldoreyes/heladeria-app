<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'price_bs' => 'required|numeric|min:0',
            'price_usd' => 'required|numeric|min:0',
            'cost_usd' => 'nullable|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
        ];
    }
}