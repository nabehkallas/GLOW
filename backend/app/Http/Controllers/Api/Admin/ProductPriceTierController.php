<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductPriceTier;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductPriceTierController extends Controller
{
    // Bulk-replaces the product's own default tier set (product_variant_id
    // null) — variant-scoped tiers are untouched.
    public function update(Request $request, Product $product)
    {
        $rows = $this->validateTiers($request);

        DB::transaction(function () use ($product, $rows) {
            $product->priceTiers()->delete();

            foreach ($rows as $row) {
                ProductPriceTier::create([
                    'product_id'         => $product->id,
                    'product_variant_id' => null,
                    'min_quantity'       => $row['min_quantity'],
                    'price'              => $row['price'] ?? null,
                    'client_price'       => $row['client_price'] ?? null,
                ]);
            }
        });

        return new ProductResource($product->fresh(['attributes.values', 'variants.attributeValues.attribute', 'images', 'priceTiers']));
    }

    // Bulk-replaces this variant's own tier set only.
    public function updateVariant(Request $request, Product $product, ProductVariant $variant)
    {
        abort_unless($variant->product_id === $product->id, 404);

        $rows = $this->validateTiers($request);

        DB::transaction(function () use ($variant, $rows) {
            $variant->priceTiers()->delete();

            foreach ($rows as $row) {
                ProductPriceTier::create([
                    'product_id'         => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'min_quantity'       => $row['min_quantity'],
                    'price'              => $row['price'] ?? null,
                    'client_price'       => $row['client_price'] ?? null,
                ]);
            }
        });

        return new ProductVariantResource($variant->fresh(['attributeValues.attribute', 'priceTiers']));
    }

    private function validateTiers(Request $request): array
    {
        $data = $request->validate([
            'tiers'                => 'present|array',
            'tiers.*.min_quantity' => 'required|integer|min:1',
            'tiers.*.price'        => 'nullable|numeric|min:0',
            'tiers.*.client_price' => 'nullable|numeric|min:0',
        ]);

        $rows = $data['tiers'];

        $quantities = array_column($rows, 'min_quantity');
        abort_if(count($quantities) !== count(array_unique($quantities)), 422, 'Each tier must have a unique minimum quantity.');

        foreach ($rows as $row) {
            abort_if(($row['price'] ?? null) === null && ($row['client_price'] ?? null) === null, 422, 'Each tier needs at least a wholesale or retail price.');
        }

        return $rows;
    }
}
