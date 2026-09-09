<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Salon;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->get('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['salons' => [], 'products' => []]);
        }

        $salons = Salon::where('name', 'like', "%{$q}%")
            ->limit(5)
            ->get(['id', 'name', 'city', 'status']);

        $products = Product::where('name', 'like', "%{$q}%")
            ->limit(5)
            ->get(['id', 'name', 'category_en', 'category_ar']);

        return response()->json([
            'salons'   => $salons,
            'products' => $products,
        ]);
    }
}
