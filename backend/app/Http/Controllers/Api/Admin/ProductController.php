<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::when($request->category, fn($q) => $q->where('category', $request->category))
            ->latest()
            ->paginate(15);

        return ProductResource::collection($products);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'category'    => 'nullable|string|max:100',
            'is_active'   => 'boolean',
        ]);

        return new ProductResource(Product::create($data));
    }

    public function show(Product $product)
    {
        return new ProductResource($product);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'sometimes|numeric|min:0',
            'stock'       => 'sometimes|integer|min:0',
            'category'    => 'nullable|string|max:100',
            'is_active'   => 'boolean',
        ]);

        $product->update($data);

        return new ProductResource($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted.']);
    }
}
