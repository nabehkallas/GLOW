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
        $products = Product::where('is_active', true)
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->latest()
            ->paginate(15);

        return ProductResource::collection($products);
    }
}
