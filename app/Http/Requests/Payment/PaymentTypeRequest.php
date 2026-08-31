<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PaymentTypeRequest extends FormRequest
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
        $paymentTypeId = $this->route('payment_type')?->id ?? $this->route('payment_type');

        return [
            'name' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:255',
            ],
            'code' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:50',
                Rule::unique('payment_types', 'code')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($paymentTypeId),
            ],
            'requires_reference' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('code')) {
            $this->merge([
                'code' => Str::slug($this->code, '_'),
            ]);
        }

        if ($this->isMethod('post')) {
            $this->merge([
                'is_active' => $this->boolean('is_active', true),
                'requires_reference' => $this->boolean('requires_reference', false),
            ]);
        }
    }
}
