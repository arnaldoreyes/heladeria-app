<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestockItemResource extends JsonResource
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
            'restock_id' => $this->restock_id,
            'product_id' => $this->product_id,
            'product_name_snapshot' => $this->product_name_snapshot,
            'quantity' => (float) $this->quantity,

            'costs' => [
                'unit_cost_usd' => (float) $this->unit_cost_usd,
                'unit_cost_bs' => (float) $this->unit_cost_bs,
                'subtotal_usd' => (float) $this->subtotal_usd,
                'subtotal_bs' => (float) $this->subtotal_bs,
            ],

            // Relaciones opcionales
            'product' => new ProductResource($this->whenLoaded('product')),
            'restock' => new RestockResource($this->whenLoaded('restock')),

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
