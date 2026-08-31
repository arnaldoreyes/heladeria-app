<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExchangeRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isPost = $this->isMethod('post');

        return [
            'type' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:50',
            ],
            'rate' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'gt:0',
            ],
            'effective_at' => [
                'nullable',
                'date',
            ],
            'is_current' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->isMethod('post') && ! $this->has('effective_at')) {
            $this->merge([
                'effective_at' => now()->toDateTimeString(),
            ]);
        }
    }
}
