<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'stock' => $this->input('stock') === '' || $this->input('stock') === null ? 0 : (int) $this->input('stock'),
            'price_bs' => $this->input('price_bs') === '' || $this->input('price_bs') === null ? 0 : (float) str_replace(',', '.', $this->input('price_bs')),
            'price_usd' => $this->input('price_usd') === '' || $this->input('price_usd') === null ? 0 : (float) str_replace(',', '.', $this->input('price_usd')),
            'cost_usd' => $this->input('cost_usd') === '' || $this->input('cost_usd') === null ? null : (float) str_replace(',', '.', $this->input('cost_usd')),
        ]);
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