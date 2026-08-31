<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestockResource extends JsonResource
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
            'user_id' => $this->user_id,
            'supplier_name' => $this->supplier_name,
            'invoice_number' => $this->invoice_number,
            'status' => $this->status,
            'notes' => $this->notes,

            'totals' => [
                'total_usd' => (float) $this->total_usd,
                'total_bs' => (float) $this->total_bs,
                'exchange_rate' => (float) $this->exchange_rate,
            ],

            'dates' => [
                'purchased_at' => $this->purchased_at?->toISOString(),
                'exchange_rate_date' => $this->exchange_rate_date?->toISOString(),
            ],

            // Relaciones opcionales cargadas condicionalmente
            'business' => new BusinessResource($this->whenLoaded('business')),
            'user' => new UserResource($this->whenLoaded('user')),
            'items' => RestockItemResource::collection($this->whenLoaded('items')),

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
