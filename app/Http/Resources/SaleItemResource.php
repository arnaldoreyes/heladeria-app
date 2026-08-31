<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name_snapshot,
            'quantity' => (float) $this->quantity,

            'pricing' => [
                'unit_price_usd' => (float) $this->unit_price_usd,
                'unit_price_bs' => (float) $this->unit_price_bs,
                'subtotal_usd' => (float) $this->subtotal_usd,
                'subtotal_bs' => (float) $this->subtotal_bs,
            ],

            'financials' => [
                'margin_usd' => (float) $this->margin_usd,
                'profit_usd' => (float) $this->profit_usd,
                'reinvestment_usd' => (float) $this->reinvestment_usd,
            ],

            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'sku' => $this->product->sku ?? null,
            ]),
        ];
    }
}
