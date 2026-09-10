<?php

namespace App\Http\Requests\ExchangeRate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExchangeConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bcv_mode' => ['required', Rule::in(['auto', 'manual'])],
            "currency_used"=> ['required', Rule::in(['USD', 'EUR'])],
            "rate_policy" =>['required', Rule::in(["immediate", 'strict',"smart_holiday"])],
            'rate' => [
                Rule::requiredIf(fn () => $this->input('bcv_mode') === 'manual'),
                'nullable',
                'numeric',
                'gt:0',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'bcv_mode.required' => 'El modo de tasa es obligatorio.',
            'bcv_mode.in' => 'El modo de tasa debe ser auto o manual.',
            'rate.required_if' => 'Debe proporcionar un monto para la tasa manual.',
            'rate.numeric' => 'La tasa debe ser un número válido.',
            'rate.gt' => 'La tasa debe ser mayor a 0.',
        ];
    }
}