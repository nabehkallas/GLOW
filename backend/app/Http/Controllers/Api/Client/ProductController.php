<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::where('is_active', true)
            ->with(['attributes.values', 'variants' => fn($q) => $q->where('is_active', true), 'variants.attributeValues.attribute', 'variants.priceTiers', 'images', 'priceTiers'])
            ->when($request->category, fn($q) => $q->where(fn($q2) => $q2->where('category_en', $request->category)->orWhere('category_ar', $request->category)))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->filter === 'on_offer', fn($q) => $this->scopeOnOffer($q))
            ->when($request->filter === 'price_breaks', fn($q) => $this->scopePriceBreaks($q))
            ->latest()
            ->paginate(20);

        return ClientProductResource::collection($products)->additional(['meta' => [
            'has_offers'       => $this->scopeOnOffer(Product::where('is_active', true))->exists(),
            'has_price_breaks' => $this->scopePriceBreaks(Product::where('is_active', true))->exists(),
        ]]);
    }

    private function scopeOnOffer($query)
    {
        $now = now();

        return $query->where(fn($q) => $q
            ->where(fn($q2) => $q2->whereNotNull('offer_price')->where('offer_starts_at', '<=', $now)->where('offer_ends_at', '>=', $now))
            ->orWhereHas('variants', fn($q2) => $q2->whereNotNull('offer_price')->where('offer_starts_at', '<=', $now)->where('offer_ends_at', '>=', $now))
        );
    }

    private function scopePriceBreaks($query)
    {
        return $query->where(fn($q) => $q
            ->whereHas('priceTiers')
            ->orWhereHas('variants.priceTiers')
        );
    }

    public function show(Product $product)
    {
        abort_unless($product->is_active, 404);

        $product->load(['attributes.values', 'variants' => fn($q) => $q->where('is_active', true), 'variants.attributeValues.attribute', 'variants.priceTiers', 'images', 'priceTiers']);

        return new ClientProductResource($product);
    }
}
