<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RestockRequest extends FormRequest
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
            'supplier_name' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:255',
            ],
            'invoice_number' => ['nullable', 'string', 'max:100'],
            'status' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                Rule::in(['completed', 'pending', 'cancelled']),
            ],

            // Tasas y conversiones
            'exchange_rate' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0.0001',
            ],
            'exchange_rate_date' => ['nullable', 'date'],

            // Totales de la compra
            'total_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'total_bs' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],

            // Fechas y notas
            'purchased_at' => [
                $isPost ? 'required' : 'sometimes',
                'date',
            ],
            'notes' => ['nullable', 'string', 'max:1000'],

            // Validación de los ítems que vienen adjuntos en la reposición
            'items' => [
                $isPost ? 'required' : 'sometimes',
                'array',
                'min:1',
            ],
            'items.*.product_id' => [
                'required_with:items',
                'string',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'items.*.quantity' => [
                'required_with:items',
                'numeric',
                'min:0.001',
            ],
            'items.*.cost_usd' => [
                'required_with:items',
                'numeric',
                'min:0',
            ],
            'items.*.cost_bs' => [
                'required_with:items',
                'numeric',
                'min:0',
            ],
        ];
    }
}
