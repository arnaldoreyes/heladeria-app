<?php

namespace App\Http\Requests;

use Carbon\Carbon;
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

    public function getStartDate(): Carbon
    {
        return Carbon::parse(
            $this->input('start_date', now()->startOfMonth())
        );
    }

    public function getEndDate(): Carbon
    {
        return Carbon::parse(
            $this->input('end_date', now()->endOfDay())
        );
    }
}
