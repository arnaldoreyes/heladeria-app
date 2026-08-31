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
        // Determinar cuál tasa está activa según el modo
        $activeRate = $this->bcv_mode === 'auto'
            ? $this->last_bcv_rate
            : ($this->bcv_manual_rate ?? $this->last_bcv_rate);

        return [
            'id'          => $this->id,
            'business_id' => $this->business_id,

            // Configuración de Tasa BCV
            'bcv_mode'            => $this->bcv_mode,
            'last_bcv_rate'       => $this->last_bcv_rate !== null ? (float) $this->last_bcv_rate : null,
            'bcv_manual_rate'     => $this->bcv_manual_rate !== null ? (float) $this->bcv_manual_rate : null,
            'active_bcv_rate'     => $activeRate !== null ? (float) $activeRate : 0.0,
            'bcv_last_updated_at' => $this->bcv_last_updated_at?->toISOString(),

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
