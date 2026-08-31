<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'is_active' => (bool) $this->is_active,

            'profit_percentage' => $this->profit_percentage !== null ? (float) $this->profit_percentage : null,
            'reinvestment_percentage' => $this->reinvestment_percentage !== null ? (float) $this->reinvestment_percentage : null,

            'products_count' => $this->whenCounted('products'),

            // Relaciones condicionales
            'parent' => new CategoryResource($this->whenLoaded('parent')),
            'children' => CategoryResource::collection($this->whenLoaded('children')),
            'children_recursive' => CategoryResource::collection($this->whenLoaded('childrenRecursive')),
            'products' => ProductResource::collection($this->whenLoaded('products')),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
