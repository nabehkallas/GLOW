<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\SalonResource;
use App\Http\Resources\SalonServiceResource;
use App\Models\Product;
use App\Models\SalonService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImageUploadController extends Controller
{
    public function salonLogo(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        $salon = $request->user()->salon;

        if ($salon->logo) {
            Storage::disk('public')->delete($salon->logo);
        }

        $path = $request->file('image')->store('logos', 'public');
        $salon->update(['logo' => $path]);

        return new SalonResource($salon);
    }

    public function serviceImage(Request $request, SalonService $service)
    {
        abort_unless($service->salon_id === $request->user()->salon->id, 403);

        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        if ($service->image) {
            Storage::disk('public')->delete($service->image);
        }

        $path = $request->file('image')->store('services', 'public');
        $service->update(['image' => $path]);

        return new SalonServiceResource($service);
    }

    public function productImage(Request $request, Product $product)
    {
        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $path = $request->file('image')->store('products', 'public');
        $product->update(['image' => $path]);

        return new ProductResource($product);
    }
}
