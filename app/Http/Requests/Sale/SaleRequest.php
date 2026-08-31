<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaleRequest extends FormRequest
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
            'customer_id' => [
                'nullable',
                'string',
                Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'sale_type' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                Rule::in(['cash', 'credit']),
            ],
            'payment_status' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                Rule::in(['paid', 'pending', 'partial']),
            ],
            'status' => [
                'sometimes',
                'string',
                Rule::in(['completed', 'cancelled']),
            ],

            // Validación de los ítems de la venta
            'items' => ['required', 'array', 'min:1'],
                'items.*.product_id' => [
                    'required',
                    'string',
                    Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
                ],
                'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
                'items.*.unit_price_usd' => ['nullable', 'numeric', 'min:0'], // Opcional, por si se aplica descuento directo al ítem

                'payments' => ['nullable', 'array'],
                'payments.*.payment_method_id' => [
                    'required_with:payments',
                    'string',
                    Rule::exists('payment_methods', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
                ],
                'payments.*.amount' => ['required_with:payments', 'numeric', 'min:0.01'],
                'payments.*.currency' => ['required_with:payments', Rule::in(['USD', 'VES'])],
                'payments.*.exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
        ];
    }
}
