<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class SalonMediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'type'       => $this->type,
            'url'        => Storage::disk('public')->url($this->path),
            'caption'    => $this->caption,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
