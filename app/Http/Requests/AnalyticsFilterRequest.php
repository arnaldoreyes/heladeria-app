<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AnalyticsFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'business_id' => ['nullable', 'string', 'exists:businesses,id'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * Extrae el business_id priorizando el usuario autenticado.
     */
    public function getBusinessId(): string
    {
        return $this->input('business_id') ?? $this->user()?->business_id;
    }

    public function getStartDate(): string
    {
        return $this->input('start_date', now()->startOfMonth()->toDateTimeString());
    }

    public function getEndDate(): string
    {
        return $this->input('end_date', now()->endOfDay()->toDateTimeString());
    }
}
