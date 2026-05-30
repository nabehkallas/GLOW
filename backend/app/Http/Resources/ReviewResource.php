<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'rating'         => $this->rating,
            'comment'        => $this->comment,
            'created_at'     => $this->created_at->toDateTimeString(),
            'appointment_id' => $this->appointment_id,
            'client'         => $this->whenLoaded('client', fn() => new UserResource($this->client)),
            'salon'          => $this->whenLoaded('salon', fn() => new SalonResource($this->salon)),
            'appointment'    => $this->whenLoaded('appointment', fn() => new AppointmentResource($this->appointment)),
        ];
    }
}
