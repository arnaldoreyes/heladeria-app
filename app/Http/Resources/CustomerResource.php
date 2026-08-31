<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'name' => $this->name,
            'type_document' => $this->type_document,
            'id_document' => $this->id_document,
            'full_document' => $this->full_document,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'credit_limit_usd' => (float) $this->credit_limit_usd,
            'is_active' => (bool) $this->is_active,
            'notes' => $this->notes,

            'sales_count' => $this->whenCounted('sales'),

            // Relaciones condicionales
            'sales' => SaleResource::collection($this->whenLoaded('sales')),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
