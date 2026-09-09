<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductAttributeResource;
use App\Models\Product;
use App\Models\ProductAttribute;
use App\Models\ProductAttributeValue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductAttributeController extends Controller
{
    public function store(Request $request, Product $product)
    {
        $data = $request->validate([
            'name'              => 'required|string|max:100',
            'type'              => 'required|in:text,color',
            'values'                => 'required|array|min:1',
            'values.*.value'       => 'required|string|max:100',
            'values.*.swatch_hex'  => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $attribute = DB::transaction(function () use ($data, $product) {
            // A previously deleted attribute with the same name still occupies the
            // (product, name) unique constraint since attributes are soft-deleted —
            // restore it instead of inserting a duplicate that would violate it.
            $existing = $product->attributes()->withTrashed()->where('name', $data['name'])->first();

            abort_if($existing && !$existing->trashed(), 422, 'An attribute with this name already exists for this product.');

            if ($existing) {
                $existing->restore();
                $existing->update([
                    'type'       => $data['type'],
                    'sort_order' => $product->attributes()->count(),
                ]);
                $attribute = $existing;
            } else {
                $attribute = $product->attributes()->create([
                    'name'       => $data['name'],
                    'type'       => $data['type'],
                    'sort_order' => $product->attributes()->count(),
                ]);
            }

            foreach ($data['values'] as $i => $value) {
                $this->upsertValue($attribute, $value['value'], $value['swatch_hex'] ?? null, $i);
            }

            return $attribute;
        });

        return new ProductAttributeResource($attribute->load('values'));
    }

    public function update(Request $request, Product $product, ProductAttribute $attribute)
    {
        abort_unless($attribute->product_id === $product->id, 404);

        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'type' => 'sometimes|in:text,color',
        ]);

        $attribute->update($data);

        return new ProductAttributeResource($attribute->load('values'));
    }

    public function destroy(Product $product, ProductAttribute $attribute)
    {
        abort_unless($attribute->product_id === $product->id, 404);

        DB::transaction(function () use ($attribute) {
            $valueIds = $attribute->values()->pluck('id');
            $product = $attribute->product;

            $product->variants()
                ->whereHas('attributeValues', fn($q) => $q->whereIn('product_attribute_values.id', $valueIds))
                ->get()
                ->each->delete();

            $attribute->values()->delete();
            $attribute->delete();
        });

        return response()->json(['message' => 'Attribute deleted.']);
    }

    public function addValue(Request $request, Product $product, ProductAttribute $attribute)
    {
        abort_unless($attribute->product_id === $product->id, 404);

        $data = $request->validate([
            'value'      => 'required|string|max:100',
            'swatch_hex' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $this->upsertValue($attribute, $data['value'], $data['swatch_hex'] ?? null, $attribute->values()->count());

        return new ProductAttributeResource($attribute->load('values'));
    }

    /**
     * Create a value under $attribute, or restore+update a previously soft-deleted
     * value with the same name — inserting a fresh row for a name that's already
     * (soft-deleted-)present would violate the (attribute, value) unique constraint.
     */
    private function upsertValue(ProductAttribute $attribute, string $value, ?string $swatchHex, int $sortOrder): ProductAttributeValue
    {
        $existing = $attribute->values()->withTrashed()->where('value', $value)->first();

        abort_if($existing && !$existing->trashed(), 422, "The value \"{$value}\" already exists for this attribute.");

        if ($existing) {
            $existing->restore();
            $existing->update(['swatch_hex' => $swatchHex, 'sort_order' => $sortOrder]);
            return $existing;
        }

        return $attribute->values()->create([
            'value'      => $value,
            'swatch_hex' => $swatchHex,
            'sort_order' => $sortOrder,
        ]);
    }

    public function updateValue(Request $request, Product $product, ProductAttributeValue $value)
    {
        abort_unless($value->attribute->product_id === $product->id, 404);

        $data = $request->validate([
            'value'      => 'sometimes|string|max:100',
            'swatch_hex' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        if (isset($data['value'])) {
            $conflict = $value->attribute->values()
                ->where('id', '!=', $value->id)
                ->where('value', $data['value'])
                ->exists();

            abort_if($conflict, 422, 'This value already exists for this attribute.');
        }

        $value->update($data);

        return new ProductAttributeResource($value->attribute->load('values'));
    }

    public function destroyValue(Product $product, ProductAttributeValue $value)
    {
        abort_unless($value->attribute->product_id === $product->id, 404);

        DB::transaction(function () use ($value, $product) {
            $product->variants()
                ->whereHas('attributeValues', fn($q) => $q->where('product_attribute_values.id', $value->id))
                ->get()
                ->each->delete();

            $value->delete();
        });

        return response()->json(['message' => 'Value deleted.']);
    }
}
