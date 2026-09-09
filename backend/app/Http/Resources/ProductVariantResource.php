<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'sku'                    => $this->sku,
            'stock'                  => $this->stock,
            'price'                  => $this->price,
            'client_price'           => $this->client_price,
            'effective_price'        => $this->priceForQuantity(1),
            'effective_client_price' => $this->priceForQuantity(1, client: true),
            'original_price'         => $this->price ?? $this->product->price,
            'original_client_price'  => $this->client_price ?? $this->product->client_price,
            'is_active'              => $this->is_active,
            'offer_price'        => $this->offer_price,
            'offer_client_price' => $this->offer_client_price,
            'offer_starts_at'    => $this->offer_starts_at,
            'offer_ends_at'      => $this->offer_ends_at,
            'is_offer_active'    => $this->isOfferActive() || $this->product->isOfferActive(),
            // Whether price_tiers below is this variant's own override set (true)
            // or the product's inherited default (false) — tells the admin UI
            // whether to pre-fill the variant's own editor or show it as a preview.
            'has_own_price_tiers' => $this->priceTiers->isNotEmpty(),
            'price_tiers' => $this->resolvedPriceTiers()->map(fn($t) => [
                'id'           => $t->id,
                'min_quantity' => $t->min_quantity,
                'price'        => $t->price,
                'client_price' => $t->client_price,
            ])->values(),
            'image_url'              => $this->image ? Storage::disk('public')->url($this->image) : null,
            'attribute_values'       => $this->whenLoaded('attributeValues', fn() => $this->attributeValues->map(fn($v) => [
                'attribute_id'   => $v->product_attribute_id,
                'attribute_name' => $v->attribute->name,
                'value_id'       => $v->id,
                'value'          => $v->value,
                'swatch_hex'     => $v->swatch_hex,
            ])),
        ];
    }

    // This variant's own tiers if it has any, else the product's default set —
    // mirrors ProductVariant::priceForQuantity()'s own resolution order.
    private function resolvedPriceTiers()
    {
        $own = $this->priceTiers;

        return $own->isNotEmpty() ? $own : $this->product->priceTiers;
    }
}
