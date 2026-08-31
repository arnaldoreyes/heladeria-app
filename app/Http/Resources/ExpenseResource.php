<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'user_id' => $this->user_id,
            'concept' => $this->concept,
            'category' => $this->category,
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,

            'amounts' => [
                'amount_usd' => (float) $this->amount_usd,
                'amount_bs' => (float) $this->amount_bs,
                'exchange_rate' => (float) $this->exchange_rate,
            ],

            'dates' => [
                'expense_date' => $this->expense_date?->format('Y-m-d'),
                'exchange_rate_date' => $this->exchange_rate_date?->toISOString(),
            ],

            // Relaciones
            'user' => new UserResource($this->whenLoaded('user')),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
