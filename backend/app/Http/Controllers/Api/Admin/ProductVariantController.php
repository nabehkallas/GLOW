<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductVariantController extends Controller
{
    /**
     * Cartesian-product-generate every missing variant combination from the
     * product's current attributes/values. A variant generated under an
     * older, smaller attribute set (e.g. before a second attribute existed)
     * no longer has a value for every current attribute — those "incomplete"
     * variants are cleared out first so they don't sit alongside the real
     * set as broken, orderable duplicates. Variants that already cover every
     * current attribute (e.g. just adding one more value to an existing
     * attribute) are left untouched, stock/price and all.
     */
    public function generate(Product $product)
    {
        $product->load('attributes.values');

        abort_if($product->attributes->isEmpty(), 422, 'Add at least one attribute with values before generating variants.');
        abort_if($product->attributes->contains(fn($a) => $a->values->isEmpty()), 422, 'Every attribute needs at least one value before generating variants.');

        $attributeIds = $product->attributes->pluck('id');

        DB::transaction(function () use ($product, $attributeIds) {
            $product->variants()
                ->with('attributeValues')
                ->get()
                ->each(function (ProductVariant $variant) use ($attributeIds) {
                    $coveredAttributeIds = $variant->attributeValues->pluck('product_attribute_id')->unique();
                    $isComplete = $coveredAttributeIds->count() === $attributeIds->count()
                        && $attributeIds->diff($coveredAttributeIds)->isEmpty();

                    if ($isComplete) {
                        return;
                    }

                    try {
                        $variant->delete();
                    } catch (\Illuminate\Database\QueryException $e) {
                        // Referenced by existing order history — can't be removed,
                        // so deactivate it instead of leaving a broken, orderable row.
                        $variant->update(['is_active' => false]);
                    }
                });

            $combinations = $this->cartesianProduct(
                $product->attributes->map(fn($attr) => $attr->values->all())->all()
            );

            $existingKeys = $product->variants()->pluck('combination_key')->all();

            foreach ($combinations as $combo) {
                $key = collect($combo)
                    ->map(fn($v) => "{$v->product_attribute_id}:{$v->id}")
                    ->sort()
                    ->implode('|');

                if (in_array($key, $existingKeys, true)) {
                    continue;
                }

                $variant = $product->variants()->create([
                    'combination_key' => $key,
                    'stock'           => 0,
                    'is_active'       => true,
                ]);

                $variant->attributeValues()->sync(collect($combo)->pluck('id'));
            }
        });

        return ProductVariantResource::collection(
            $product->variants()->with('attributeValues.attribute')->get()
        );
    }

    public function bulkUpdate(Request $request, Product $product)
    {
        $data = $request->validate([
            'variants'                    => 'required|array',
            'variants.*.id'               => 'required|integer',
            'variants.*.sku'              => 'nullable|string|max:100',
            'variants.*.stock'            => 'required|integer|min:0',
            'variants.*.price'            => 'nullable|numeric|min:0',
            'variants.*.client_price'     => 'nullable|numeric|min:0',
            'variants.*.is_active'        => 'boolean',
        ]);

        DB::transaction(function () use ($data, $product) {
            foreach ($data['variants'] as $row) {
                $variant = $product->variants()->where('id', $row['id'])->firstOrFail();
                $variant->update([
                    'sku'          => $row['sku'] ?? null,
                    'stock'        => $row['stock'],
                    'price'        => $row['price'] ?? null,
                    'client_price' => $row['client_price'] ?? null,
                    'is_active'    => $row['is_active'] ?? true,
                ]);
            }
        });

        return ProductVariantResource::collection(
            $product->variants()->with('attributeValues.attribute')->get()
        );
    }

    public function destroy(Product $product, ProductVariant $variant)
    {
        abort_unless($variant->product_id === $product->id, 404);

        $variant->delete();

        return response()->json(['message' => 'Variant deleted.']);
    }

    private function cartesianProduct(array $arrays): array
    {
        return array_reduce($arrays, function ($carry, $items) {
            $result = [];
            foreach ($carry as $combo) {
                foreach ($items as $item) {
                    $result[] = [...$combo, $item];
                }
            }
            return $result;
        }, [[]]);
    }
}
