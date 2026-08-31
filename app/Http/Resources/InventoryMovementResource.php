<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'product_id' => $this->product_id,
            'user_id' => $this->user_id,
            'type' => $this->type,
            'notes' => $this->notes,

            // Métricas de stock
            'stock' => [
                'quantity' => (float) $this->quantity,
                'previous_stock' => (float) $this->previous_stock,
                'new_stock' => (float) $this->new_stock,
            ],

            // Enlace Polimórfico (Sale / Restock / Expense)
            'reference' => [
                'type' => $this->reference_type,
                'id' => $this->reference_id,
            ],

            // Relaciones opcionales
            'product' => new ProductResource($this->whenLoaded('product')),
            'user' => new UserResource($this->whenLoaded('user')),

            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
