<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $category = $this->route('category');
        $categoryId = is_object($category) ? $category->id : $category;

        $businessId = app()->bound('current_business_id')
            ? app('current_business_id')
            : ($this->input('business_id') ?? $category?->business_id);

        $isPost = $this->isMethod('post');

        return [
            'name' => [
                $isPost ? 'required' : 'sometimes',
                'string',
                'max:255',
                Rule::unique('categories', 'name')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($categoryId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'profit_percentage' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'between:0,100',
            ],
            'reinvestment_percentage' => [
                $isPost ? 'required' : 'sometimes',
                'numeric',
                'between:0,100',
            ],
            'parent_id' => [
                'nullable',
                'string',
                Rule::exists('categories', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
                Rule::notIn(filter_var($categoryId, FILTER_UNSAFE_RAW ) ? [$categoryId] : []),
            ],
        ];
    }
}
