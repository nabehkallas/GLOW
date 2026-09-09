<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleBlockResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'salon_id'          => $this->salon_id,
            'salon_service_id'  => $this->salon_service_id,
            'starts_at'         => $this->starts_at->toDateTimeString(),
            'duration_minutes'  => $this->duration_minutes,
            'note'              => $this->note,
            'service'           => $this->whenLoaded('service', fn() => $this->service ? [
                'id'   => $this->service->id,
                'name' => $this->service->name,
            ] : null),
        ];
    }
}
