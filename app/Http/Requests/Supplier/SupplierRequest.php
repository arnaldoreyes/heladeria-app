<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $supplier = $this->route('supplier') ?? $this->route('ssupplier');
        $supplierId = is_object($supplier) ? $supplier->id : $supplier;

         $businessId = app()->bound('current_business_id')
            ? app('current_business_id')
            : ($this->user()?->business_id ?? $this->input('business_id'));

        $isPost = $this->isMethod('post');

        return [
            'name' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:255',
                Rule::unique('suppliers', 'name')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($supplierId),
            ],
            'tax_id' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('suppliers', 'tax_id')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($supplierId),
            ],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Mensajes de error personalizados (opcional).
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'Ya existe un proveedor registrado con este nombre en este negocio.',
            'tax_id.unique' => 'El documento fiscal (RUT/RFC/RIF) ya está asignado a otro proveedor.',
        ];
    }
}
