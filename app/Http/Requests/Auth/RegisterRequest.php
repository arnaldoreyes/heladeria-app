<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        
        return [
            'businessName'          => ['required', 'string', 'max:255'],
            'ownerName'             => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'              => ['required', 'string', 'min:8'],
            'nicho'                 => ['required', 'string', 'max:100'],
            'baseCurrency'          => ['required', 'string', 'in:USD,BS'],
            'businessFundPercent'   => ['required', 'numeric', 'min:0', 'max:100'],
            'personalProfitPercent' => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }
}