<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado a hacer esta petición.
     */
    public function authorize(): bool
    {
        return true; 
    }

    /**
     * Reglas de validación.
     */
    public function rules(): array
    {
        return [
            'cart' => 'required|array',
            'cart.*.product.id' => 'required|exists:products,id',
            'cart.*.quantity' => 'required|integer|min:1',
            'tasa_bcv' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:Efectivo,Pago Movil,Divisas',
        ];
    }

    /**
     * Mensajes personalizados (Opcional, pero recomendado)
     */
    public function messages(): array
    {
        return [
            'payment_method.in' => 'El método de pago seleccionado no es válido.',
        ];
    }
}