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
            'client_price' => $this->client_price,
            'stock'       => $this->effectiveStock(),
            'category_en' => $this->category_en,
            'category_ar' => $this->category_ar,
            'is_active'   => $this->is_active,
            'offer_price'        => $this->offer_price,
            'offer_client_price' => $this->offer_client_price,
            'offer_starts_at'    => $this->offer_starts_at,
            'offer_ends_at'      => $this->offer_ends_at,
            'is_offer_active'    => $this->isOfferActive(),
            'has_offer'          => $this->isOfferActive() || $this->anyVariantHasOffer(),
            'has_price_breaks'   => $this->priceTiers->isNotEmpty() || $this->anyVariantHasPriceBreaks(),
            'price_tiers' => $this->whenLoaded('priceTiers', fn() => $this->priceTiers->map(fn($t) => [
                'id'           => $t->id,
                'min_quantity' => $t->min_quantity,
                'price'        => $t->price,
                'client_price' => $t->client_price,
            ])),
            'image_url'   => $this->image ? Storage::disk('public')->url($this->image) : null,
            'attributes'  => $this->whenLoaded('attributes', fn() => ProductAttributeResource::collection($this->attributes)),
            'variants'    => $this->whenLoaded('variants', fn() => ProductVariantResource::collection($this->variants)),
            'variants_count' => $this->whenCounted('variants'),
            'images'      => $this->whenLoaded('images', fn() => ProductImageResource::collection($this->images)),
        ];
    }

    // A product's own `stock` column is only meaningful while it has no
    // variants — once variants exist, stock is tracked per-variant, and the
    // raw column drifts (nothing keeps it in sync). This always reports the
    // real number: the sum of active variants' stock when any exist.
    private function effectiveStock(): int
    {
        if ($this->relationLoaded('variants')) {
            $activeVariants = $this->variants->where('is_active', true);
            return $activeVariants->isNotEmpty() ? (int) $activeVariants->sum('stock') : (int) $this->stock;
        }

        if (($this->variants_count ?? 0) > 0) {
            return (int) ($this->active_variant_stock ?? 0);
        }

        return (int) $this->stock;
    }

    // Best-effort: only accurate where `variants` is eager-loaded (every
    // shopping-frontend listing endpoint); degrades to false on admin's
    // count/sum-only product list, which doesn't use this field.
    private function anyVariantHasOffer(): bool
    {
        return $this->relationLoaded('variants')
            ? $this->variants->contains(fn($v) => $v->isOfferActive())
            : false;
    }

    private function anyVariantHasPriceBreaks(): bool
    {
        return $this->relationLoaded('variants')
            ? $this->variants->contains(fn($v) => $v->priceTiers->isNotEmpty())
            : false;
    }
}
