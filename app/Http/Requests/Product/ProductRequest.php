<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $businessId = app()->bound('current_business_id')
            ? app('current_business_id')
            : ($this->user()?->business_id ?? $this->input('business_id'));

        $isPost = $this->isMethod('post');
        $productId = $this->route('product')?->id ?? $this->route('product');

        return [
            'category_id' => [
                'nullable',
                'string',
                Rule::exists('categories', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'subcategory_id' => [
                'nullable',
                'string',
                Rule::exists('subcategories', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'sku' => [
                'nullable', // Opcional en POST (el Hook static::creating lo genera si viene vacío)
                'string',
                'max:50',
                Rule::unique('products', 'sku')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($productId),
            ],
            'name' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:255',
            ],

            // Precios y Costos
            'price_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'cost_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],

            // Inventario
            'stock' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'min_stock_alert' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],

            // Multimedia y Estado
            'image' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
