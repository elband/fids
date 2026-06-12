<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WeatherResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'suhu' => round($this->suhu),
            'kondisi_cuaca' => $this->kondisi_cuaca,
            'icon' => $this->icon,
            'humidity' => $this->humidity,
            'wind_speed' => $this->wind_speed,
            'last_updated' => $this->updated_at,
        ];
    }
}
