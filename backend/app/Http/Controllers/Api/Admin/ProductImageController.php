<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    public function store(Request $request, Product $product)
    {
        $request->validate([
            'file' => 'required|file|mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime|max:51200',
        ]);

        $mime = $request->file('file')->getMimeType();
        $type = str_starts_with($mime, 'video/') ? 'video' : 'image';

        $folder = $type === 'video' ? 'product-videos' : 'products';
        $path   = $request->file('file')->store($folder, 'public');

        $image = $product->images()->create([
            'type'       => $type,
            'path'       => $path,
            'sort_order' => $product->images()->max('sort_order') + 1,
        ]);

        return new ProductImageResource($image);
    }

    public function destroy(Product $product, ProductImage $image)
    {
        abort_unless($image->product_id === $product->id, 404);

        Storage::disk('public')->delete($image->path);
        $image->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
