<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isPost = $this->isMethod('post');
        $userId = $this->route('user')?->id ?? $this->route('user');

        return [
            'business_id' => ['nullable', 'exists:businesses,id'],
            'name' => [$isPost ? 'required' : 'sometimes', 'string', 'max:255'],
            'email' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => [
                $isPost ? 'required' : 'nullable',
                'string',
                Password::defaults(),
            ],
            'role' => ['nullable', 'string', 'exists:roles,name'],
        ];
    }

    protected function passedValidation(): void
    {
        $currentUser = $this->user();

        // Si el usuario autenticado NO es superadmin, asignamos obligatoriamente su business_id
        if (!$currentUser->hasRole('superadmin')) {
            $businessId = app()->bound('current_business_id')
                ? app('current_business_id')
                : $currentUser->business_id;

            $this->merge([
                'business_id' => $businessId,
            ]);
        }
    }

    /**
     * Devuelve los datos validados combinando los valores inyectados en passedValidation.
     */
    public function validated($key = null, $default = null): array
    {
        return array_merge(parent::validated(), [
            'business_id' => $this->input('business_id'),
        ]);
    }
}
