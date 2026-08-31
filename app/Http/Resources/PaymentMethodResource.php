<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentMethodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'payment_type_id' => $this->payment_type_id,
            'name' => $this->name,
            'currency' => $this->currency,
            'is_active' => (bool) $this->is_active,

            'account_details' => [
                'bank_name' => $this->bank_name,
                'account_number' => $this->account_number,
                'phone_number' => $this->phone_number,
                'id_document' => $this->id_document,
                'email' => $this->email,
            ],

            // Relaciones opcionales
            'type' => new PaymentTypeResource($this->whenLoaded('type')),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
