<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\CashTransaction;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::withCount('variants')
            ->withSum(['variants as active_variant_stock' => fn($q) => $q->where('is_active', true)], 'stock')
            ->with('priceTiers')
            ->when($request->category, fn($q) => $q->where(fn($q2) => $q2->where('category_en', $request->category)->orWhere('category_ar', $request->category)))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate($request->get('per_page', 15));

        return ProductResource::collection($products);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'price'         => 'required|numeric|min:0',
            'client_price'  => 'required|numeric|min:0',
            'stock'         => 'required|integer|min:0',
            'category_en'   => 'nullable|string|max:100',
            'category_ar'   => 'nullable|string|max:100',
            'is_active'     => 'boolean',
        ]);

        return new ProductResource(Product::create($data));
    }

    public function show(Product $product)
    {
        return new ProductResource($product->load('attributes.values', 'variants.attributeValues.attribute', 'variants.priceTiers', 'images', 'priceTiers'));
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'description'   => 'nullable|string',
            'price'         => 'sometimes|numeric|min:0',
            'client_price'  => 'sometimes|numeric|min:0',
            'stock'         => 'sometimes|integer|min:0',
            'category_en'   => 'nullable|string|max:100',
            'category_ar'   => 'nullable|string|max:100',
            'is_active'     => 'boolean',
        ]);

        $product->update($data);

        return new ProductResource($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted.']);
    }

    public function addStock(Request $request, Product $product)
    {
        $data = $request->validate([
            'quantity'           => 'required|integer|min:1',
            'product_variant_id' => 'nullable|exists:product_variants,id',
        ]);

        if (!empty($data['product_variant_id'])) {
            $variant = ProductVariant::where('id', $data['product_variant_id'])
                ->where('product_id', $product->id)
                ->firstOrFail();
            $variant->increment('stock', $data['quantity']);
        } else {
            abort_if($product->variants()->exists(), 422, 'This product has variants — add stock to a specific variant instead.');
            $product->increment('stock', $data['quantity']);
        }

        return new ProductResource($product->fresh(['attributes.values', 'variants.attributeValues.attribute', 'variants.priceTiers', 'images', 'priceTiers']));
    }

    public function directSell(Request $request, Product $product)
    {
        $data = $request->validate([
            'quantity'           => 'required|integer|min:1',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'salon_id'           => 'nullable|exists:salons,id',
            'note'               => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($data, $product) {
            $variant = null;

            if (!empty($data['product_variant_id'])) {
                $variant = ProductVariant::where('id', $data['product_variant_id'])
                    ->where('product_id', $product->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                abort_if($variant->stock < $data['quantity'], 422, 'Insufficient stock for this variant.');

                $variant->decrement('stock', $data['quantity']);
            } else {
                abort_if($product->variants()->exists(), 422, 'This product has variants — sell a specific variant instead.');
                abort_if($product->stock < $data['quantity'], 422, 'Insufficient stock for this product.');

                $product->decrement('stock', $data['quantity']);
            }

            if ($variant) {
                $variant->setRelation('product', $product);
            }

            $unitPrice = $variant
                ? $variant->priceForQuantity($data['quantity'], client: true)
                : $product->priceForQuantity($data['quantity'], client: true);

            CashTransaction::create([
                'salon_id' => $data['salon_id'] ?? null,
                'type'     => 'in',
                'category' => 'product_sale',
                'amount'   => $unitPrice * $data['quantity'],
                'note'     => $data['note'] ?? ("بيع مباشر: {$product->name}" . ($variant ? ' (' . $variant->sku . ')' : '')),
                'date'     => Carbon::today()->toDateString(),
            ]);
        });

        return new ProductResource($product->fresh(['attributes.values', 'variants.attributeValues.attribute', 'variants.priceTiers', 'images', 'priceTiers']));
    }
}
