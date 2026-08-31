<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'category_id' => $this->category_id,
            'sku' => $this->sku,
            'name' => $this->name,
            'image_url' => $this->image ? asset('storage/' . $this->image) : null,
            'is_active' => (bool) $this->is_active,

            // Precios
            'pricing' => [
                'price_usd' => (float) $this->price_usd,
                'cost_usd' => (float) $this->cost_usd,
            ],

            // Inventario / Stock
            'inventory' => [
                'stock' => (float) $this->stock,
                'min_stock_alert' => (float) $this->min_stock_alert,
                'is_low_stock' => $this->stock <= $this->min_stock_alert,
            ],

            // Relaciones opcionales
            'category' => new CategoryResource($this->whenLoaded('category')),
            'business' => new BusinessResource($this->whenLoaded('business')),
            'inventory_movements' => InventoryMovementResource::collection($this->whenLoaded('inventoryMovements')),

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
