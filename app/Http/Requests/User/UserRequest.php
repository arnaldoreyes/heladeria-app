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
}
