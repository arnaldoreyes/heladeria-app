<?php

namespace App\Http\Requests;

use App\Models\ExchangeRate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isPost = $this->isMethod('post');

        return [
            'concept' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:255',
            ],
            'category' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:100',
            ],

            // Al menos un monto debe estar presente al crear
            'amount_usd' => [
                'nullable',
                'numeric',
                'min:0',
                Rule::requiredIf($isPost && ! $this->filled('amount_bs')),
            ],
            'amount_bs' => [
                'nullable',
                'numeric',
                'min:0',
                Rule::requiredIf($isPost && ! $this->filled('amount_usd')),
            ],
            'exchange_rate' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'gt:0',
            ],
            'exchange_rate_date' => ['nullable', 'date'],

            'payment_method' => ['nullable', 'string', 'max:100'],
            'expense_date' => [
                $isPost ? 'required' : 'sometimes',
                'date',
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Si no envía tasa de cambio al crear, busca la tasa activa (BCV por defecto)
        if ($this->isMethod('post') && ! $this->filled('exchange_rate')) {
            $activeRate = ExchangeRate::getActiveRate();

            if ($activeRate) {
                $this->merge([
                    'exchange_rate' => $activeRate->rate,
                    'exchange_rate_date' => $activeRate->effective_at,
                ]);
            }
        }

        // Si no envía fecha del gasto, asigna hoy por defecto
        if ($this->isMethod('post') && ! $this->filled('expense_date')) {
            $this->merge([
                'expense_date' => now()->toDateString(),
            ]);
        }
    }
}
