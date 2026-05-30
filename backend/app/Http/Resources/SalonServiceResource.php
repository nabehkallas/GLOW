<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class SalonServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'description'      => $this->description,
            'price'            => $this->price,
            'duration_minutes' => $this->duration_minutes,
            'category'         => $this->category,
            'is_active'        => $this->is_active,
            'available_from'   => $this->available_from,
            'available_until'  => $this->available_until,
            'image_url'        => $this->image ? Storage::disk('public')->url($this->image) : null,
        ];
    }
}
