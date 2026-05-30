<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class SalonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'description'      => $this->description,
            'address'          => $this->address,
            'city'             => $this->city,
            'latitude'         => $this->latitude,
            'longitude'        => $this->longitude,
            'logo_url'         => $this->logo ? Storage::disk('public')->url($this->logo) : null,
            'status'           => $this->status,
            'capacity'         => $this->capacity,
            'rejection_reason' => $this->rejection_reason,
            'average_rating'   => $this->average_rating,
            'reviews_count'    => $this->reviews_count,
            'distance_km'      => $this->distance_km ?? null,
            'phone'            => $this->whenLoaded('user', fn() => $this->user->phone),
            'user'             => $this->whenLoaded('user', fn() => new UserResource($this->user)),
            'services'         => $this->whenLoaded('services', fn() => SalonServiceResource::collection($this->services)),
            'working_hours'    => $this->whenLoaded('workingHours', fn() => WorkingHourResource::collection($this->workingHours)),
        ];
    }
}
