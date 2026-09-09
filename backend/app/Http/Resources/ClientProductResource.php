<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ClientProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'price'       => $this->client_price,
            'stock'       => $this->effectiveStock(),
            'category_en' => $this->category_en,
            'category_ar' => $this->category_ar,
            'offer_price'     => $this->offer_client_price,
            'offer_starts_at' => $this->offer_starts_at,
            'offer_ends_at'   => $this->offer_ends_at,
            'is_offer_active' => $this->isOfferActive(),
            'has_offer'        => $this->isOfferActive() || $this->anyVariantHasOffer(),
            'has_price_breaks' => $this->priceTiers->isNotEmpty() || $this->anyVariantHasPriceBreaks(),
            'price_tiers' => $this->whenLoaded('priceTiers', fn() => $this->priceTiers->map(fn($t) => [
                'min_quantity' => $t->min_quantity,
                'price'        => $t->client_price,
            ])->filter(fn($t) => $t['price'] !== null)->values()),
            'image_url'   => $this->image ? Storage::disk('public')->url($this->image) : null,
            'attributes'  => $this->whenLoaded('attributes', fn() => ProductAttributeResource::collection($this->attributes)),
            'variants'    => $this->whenLoaded('variants', fn() => ClientProductVariantResource::collection($this->variants)),
            'images'      => $this->whenLoaded('images', fn() => ProductImageResource::collection($this->images)),
        ];
    }

    // See ProductResource::effectiveStock() — same reasoning, kept in sync here.
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
