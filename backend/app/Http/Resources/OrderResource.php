<?php

namespace App\Http\Resources;

use App\Models\Setting;
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
            'delivered_at' => $this->delivered_at?->toDateTimeString(),
            'return_reason' => $this->return_reason,
            'cancellation_reason' => $this->cancellation_reason,
            'can_request_return' => $this->status === 'delivered'
                && $this->delivered_at
                && $this->delivered_at->diffInDays(now()) <= (int) Setting::get('return_window_days', 14),
            'can_request_cancel' => in_array($this->status, ['confirmed', 'shipped']),
            'salon'        => $this->whenLoaded('salon', fn() => new SalonResource($this->salon)),
            'items'        => $this->whenLoaded('items', fn() => OrderItemResource::collection($this->items)),
        ];
    }
}
