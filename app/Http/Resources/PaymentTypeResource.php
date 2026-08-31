<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'name' => $this->name,
            'code' => $this->code,
            'requires_reference' => (bool) $this->requires_reference,
            'is_active' => (bool) $this->is_active,

            // Relaciones opcionales
            'methods' => PaymentMethodResource::collection($this->whenLoaded('methods')),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
