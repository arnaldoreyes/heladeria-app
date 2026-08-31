<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RestockItemRequest extends FormRequest
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
            'restock_id' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                Rule::exists('restocks', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
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

            // Costos unitarios y subtotales
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
            'subtotal_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'subtotal_bs' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
        ];
    }
}
