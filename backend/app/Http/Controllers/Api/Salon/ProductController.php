<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        // Not paginated — salon's own bounded catalog, not a public storefront.
        $products = Product::where('is_active', true)
            ->with(['attributes.values', 'variants' => fn($q) => $q->where('is_active', true), 'variants.attributeValues.attribute', 'variants.priceTiers', 'images', 'priceTiers'])
            ->when($request->category, fn($q) => $q->where(fn($q2) => $q2->where('category_en', $request->category)->orWhere('category_ar', $request->category)))
            ->latest()
            ->get();

        return ProductResource::collection($products);
    }
}
