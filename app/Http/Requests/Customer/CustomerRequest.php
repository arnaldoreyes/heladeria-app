<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $customer = $this->route('customer');
        $customerId = is_object($customer) ? $customer->id : $customer;

        $businessId = app()->bound('current_business_id')
            ? app('current_business_id')
            : ($this->user()?->business_id ?? $customer?->business_id);

        $isPost = $this->isMethod('post');

        return [
            'name' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:255',
            ],
            'type_document' => [
                'nullable',
                'required_with:id_document',
                'string',
                'max:10',
            ],
            'id_document' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('customers', 'id_document')
                    ->where(function ($query) use ($businessId) {
                        return $query->where('business_id', $businessId)
                            ->where('type_document', $this->input('type_document'));
                    })
                    ->ignore($customerId),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'credit_limit_usd' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
            ],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
