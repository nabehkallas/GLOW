<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'scheduled_at'     => $this->scheduled_at->toDateTimeString(),
            'status'           => $this->status,
            'notes'            => $this->notes,
            'cancellation_reason' => $this->cancellation_reason,
            'duration_minutes' => $this->duration_minutes,
            'source'           => $this->source,
            'client_name'      => $this->client_name,
            'client_phone'     => $this->client_phone,
            'price_at_booking' => $this->price_at_booking,
            'client'           => $this->whenLoaded('client', fn() => new UserResource($this->client)),
            'salon'            => $this->whenLoaded('salon', fn() => new SalonResource($this->salon)),
            'service'          => $this->whenLoaded('service', fn() => new SalonServiceResource($this->service)),
        ];
    }
}
