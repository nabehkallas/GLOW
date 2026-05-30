<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'price'       => $this->price,
            'stock'       => $this->stock,
            'category'    => $this->category,
            'is_active'   => $this->is_active,
            'image_url'   => $this->image ? Storage::disk('public')->url($this->image) : null,
        ];
    }
}
