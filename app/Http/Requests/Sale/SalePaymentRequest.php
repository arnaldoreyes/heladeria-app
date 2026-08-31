<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SalePaymentRequest extends FormRequest
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
            'payment_method_id' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                Rule::exists('payment_methods', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],

            // Montos y monedas
            'amount_original' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0.01',
            ],
            'amount_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0.01',
            ],
            'currency' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                Rule::in(['USD', 'VES']),
            ],

            // Tasa y fecha aplicada al pago
            'exchange_rate' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0.0001',
            ],
            'exchange_rate_date' => ['nullable', 'date'],

            // Referencia y notas adicionales
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
