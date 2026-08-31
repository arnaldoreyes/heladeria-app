<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalePaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_method_id' => $this->payment_method_id,
            'currency' => $this->currency,
            'amount_original' => (float) $this->amount_original,
            'amount_usd' => (float) $this->amount_usd,
            'exchange_rate' => (float) $this->exchange_rate,
            'reference' => $this->reference,
            'payment_method_name' => $this->whenLoaded('method', fn () => $this->method->name),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
