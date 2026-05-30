<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'quantity'   => $this->quantity,
            'unit_price' => $this->unit_price,
            'subtotal'   => round($this->quantity * $this->unit_price, 2),
            'product'    => $this->whenLoaded('product', fn() => new ProductResource($this->product)),
        ];
    }
}
