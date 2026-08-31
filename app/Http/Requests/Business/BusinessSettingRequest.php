<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isPost = $this->isMethod('post');

        return [
            'bcv_mode' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                Rule::in(['auto', 'manual']),
            ],
            'last_bcv_rate'   => ['nullable', 'numeric', 'min:0'],
            'bcv_manual_rate' => ['nullable', 'numeric', 'min:0'],

            // Márgenes y porcentajes por defecto
            'default_profit_percentage' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
                'max:100',
            ],
            'default_reinvestment_percentage' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'min:0',
                'max:100',
            ],

            // Preferencias de impresión y textos
            'print_ticket_on_sale' => ['sometimes', 'boolean'],
            'ticket_header_notes'  => ['nullable', 'string', 'max:1000'],
            'ticket_footer_notes'  => ['nullable', 'string', 'max:1000'],
        ];
    }
}
