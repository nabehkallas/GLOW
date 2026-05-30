<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'status'       => $this->status,
            'total_amount' => $this->total_amount,
            'notes'        => $this->notes,
            'created_at'   => $this->created_at->toDateTimeString(),
            'salon'        => $this->whenLoaded('salon', fn() => new SalonResource($this->salon)),
            'items'        => $this->whenLoaded('items', fn() => OrderItemResource::collection($this->items)),
        ];
    }
}
