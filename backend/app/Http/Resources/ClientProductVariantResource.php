<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ClientProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'stock'             => $this->stock,
            'price'             => $this->priceForQuantity(1, client: true),
            'original_price'    => $this->client_price ?? $this->product->client_price,
            'is_active'         => $this->is_active,
            'offer_price'     => $this->offer_client_price,
            'offer_starts_at' => $this->offer_starts_at,
            'offer_ends_at'   => $this->offer_ends_at,
            'is_offer_active' => $this->isOfferActive() || $this->product->isOfferActive(),
            'price_tiers' => $this->resolvedPriceTiers()->map(fn($t) => [
                'min_quantity' => $t->min_quantity,
                'price'        => $t->client_price,
            ])->filter(fn($t) => $t['price'] !== null)->values(),
            'image_url'         => $this->image ? Storage::disk('public')->url($this->image) : null,
            'attribute_values'  => $this->whenLoaded('attributeValues', fn() => $this->attributeValues->map(fn($v) => [
                'attribute_id'   => $v->product_attribute_id,
                'attribute_name' => $v->attribute->name,
                'value_id'       => $v->id,
                'value'          => $v->value,
                'swatch_hex'     => $v->swatch_hex,
            ])),
        ];
    }

    private function resolvedPriceTiers()
    {
        $own = $this->priceTiers;

        return $own->isNotEmpty() ? $own : $this->product->priceTiers;
    }
}
