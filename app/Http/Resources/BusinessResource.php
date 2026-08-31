<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'name'     => $this->name,
            'slug'     => $this->slug,
            'niche'    => $this->niche,
            'status'   => $this->status,
            'logo_url' => $this->logo_url,

            // Relación de configuración (1 a 1)
            'settings' => new BusinessSettingResource($this->whenLoaded('settings')),

            // Relaciones opcionales (cargadas condicionalmente)
            'users'          => UserResource::collection($this->whenLoaded('users')),
            'categories'     => CategoryResource::collection($this->whenLoaded('categories')),
            'exchange_rates' => ExchangeRateResource::collection($this->whenLoaded('exchangeRates')),

            // Timestamps tipados
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
