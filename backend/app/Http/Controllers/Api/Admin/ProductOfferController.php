<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class ProductOfferController extends Controller
{
    public function update(Request $request, Product $product)
    {
        $product->update($this->validateOffer($request));

        return new ProductResource($product->fresh(['attributes.values', 'variants.attributeValues.attribute', 'images', 'priceTiers']));
    }

    public function updateVariant(Request $request, Product $product, ProductVariant $variant)
    {
        abort_unless($variant->product_id === $product->id, 404);

        $variant->update($this->validateOffer($request));

        return new ProductVariantResource($variant->fresh(['attributeValues.attribute', 'priceTiers']));
    }

    // Either every offer field is present (sets the offer) or every field is
    // absent/null (clears it) — no partially-set offer is allowed.
    private function validateOffer(Request $request): array
    {
        $hasAny = collect(['offer_price', 'offer_client_price', 'offer_starts_at', 'offer_ends_at'])
            ->contains(fn($field) => $request->filled($field));

        if (!$hasAny) {
            return [
                'offer_price'        => null,
                'offer_client_price' => null,
                'offer_starts_at'    => null,
                'offer_ends_at'      => null,
            ];
        }

        return $request->validate([
            'offer_price'        => 'required|numeric|min:0',
            'offer_client_price' => 'required|numeric|min:0',
            'offer_starts_at'    => 'required|date',
            'offer_ends_at'      => 'required|date|after:offer_starts_at',
        ]);
    }
}
