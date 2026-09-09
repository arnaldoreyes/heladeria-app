<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaymentMethodBulkStatusUpdateRequest extends FormRequest
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

        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'required',
                'string',
                Rule::exists('payment_methods', 'id')->where(
                    fn ($query) => $query->where('business_id', $businessId)->orWhereNull('business_id'),
                ),
            ],
            'is_active' => ['required', 'boolean'],
        ];
    }
}