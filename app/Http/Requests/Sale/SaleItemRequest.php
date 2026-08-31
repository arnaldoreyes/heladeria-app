<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaleItemRequest extends FormRequest
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

        return [
            'sale_id' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                Rule::exists('sales', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'product_id' => [
                'nullable',
                'string',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'product_name_snapshot' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:255',
            ],
            'quantity' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0.001',
            ],

            // Precios y costos
            'unit_price_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'unit_price_bs' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'unit_cost_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'unit_cost_bs' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],

            // Totales y márgenes
            'subtotal_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'cost_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'margin_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
            ],
            'subtotal_bs' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'cost_bs' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'margin_bs' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
            ],

            // Porcentajes de distribución (Snapshot)
            'profit_percentage' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'between:0,100',
            ],
            'reinvestment_percentage' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'between:0,100',
            ],

            // Distribuciones monetarias
            'reinvestment_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'profit_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'reinvestment_bs' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'profit_bs' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
        ];
    }
}
