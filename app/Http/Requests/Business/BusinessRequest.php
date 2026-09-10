<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $business = $this->route('business');
        $businessId = is_object($business) ? $business->id : $business;
        $isPost = $this->isMethod('post');

        return [
            'name' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:255',
            ],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('businesses', 'slug')->ignore($businessId),
            ],
            'niche' => ['nullable', 'string', 'max:100'],
            'status' => [
                $isPost ? 'nullable' : 'sometimes',
                'string',
                Rule::in(['active', 'inactive', 'suspended']),
            ],
            'logo_url' => ['nullable', 'url', 'max:500'],
            'settings' => ['nullable', 'array'],
            'settings.bcv_mode' => ['nullable', 'string'],
            'settings.default_profit_percentage' => ['nullable', 'numeric'],
            'settings.default_reinvestment_percentage' => ['nullable', 'numeric'],
            'settings.print_ticket_on_sale' => ['nullable', 'boolean'],
            'settings.ticket_header_notes' => ['nullable', 'string'],
            'settings.ticket_footer_notes' => ['nullable', 'string'],
 
        ];
    }
}
