<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $businessId = app()->bound('current_business_id')
            ? app('current_business_id')
            : $this->user()?->business_id;

        $isPost = $this->isMethod('post');

        return [
            'payment_type_id' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                Rule::exists('payment_types', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'name' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:255',
            ],
            'currency' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                Rule::in(['USD', 'VES']),
            ],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'phone_number' => ['nullable', 'string', 'max:30'],
            'id_document' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('currency')) {
            $this->merge([
                'currency' => strtoupper($this->currency),
            ]);
        }

        if ($this->isMethod('post') && ! $this->has('is_active')) {
            $this->merge([
                'is_active' => true,
            ]);
        }
    }
}
