<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessSettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'business_id' => $this->business_id,

            // Configuración de Tasa BCV
            'bcv_mode'            => $this->bcv_mode,
            'currency_used'       => $this->currency_used,
            'rate_policy'         => $this->rate_policy,

            // Porcentajes por defecto
            'default_profit_percentage'       => (float) $this->default_profit_percentage,
            'default_reinvestment_percentage' => (float) $this->default_reinvestment_percentage,

            // Configuración de Impresión / Tickets
            'print_ticket_on_sale' => (bool) $this->print_ticket_on_sale,
            'ticket_header_notes'  => $this->ticket_header_notes,
            'ticket_footer_notes'  => $this->ticket_footer_notes,

            // Relación opcional de retorno
            'business' => new BusinessResource($this->whenLoaded('business')),

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
