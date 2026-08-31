<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'status' => $this->status,
            'sale_type' => $this->sale_type,
            'payment_status' => $this->payment_status,

            'totals' => [
                'total_usd' => (float) $this->total_usd,
                'total_bs' => (float) $this->total_bs,
                'paid_usd' => (float) $this->paid_usd,
                'pending_usd' => (float) $this->pending_usd,
                'exchange_rate' => (float) $this->exchange_rate,
                'discount_bs' => (float) $this->discount_bs,
            ],

            'financial_breakdown' => [
                'cost_usd' => (float) $this->cost_usd,
                'margin_usd' => (float) $this->margin_usd,
                'reinvestment_usd' => (float) $this->reinvestment_usd,
                'profit_usd' => (float) $this->profit_usd,
            ],

            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'identification' => $this->customer->identification,
            ]),

            'items' => SaleItemResource::collection($this->whenLoaded('items')),
            'payments' => SalePaymentResource::collection($this->whenLoaded('payments')),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
