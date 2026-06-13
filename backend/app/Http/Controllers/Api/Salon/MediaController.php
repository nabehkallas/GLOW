<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalonMediaResource;
use App\Models\SalonMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        $media = $request->user()->salon
            ->media()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return SalonMediaResource::collection($media);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file'    => 'required|file|mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime|max:51200',
            'caption' => 'nullable|string|max:255',
        ]);

        $mime = $request->file('file')->getMimeType();
        $type = str_starts_with($mime, 'video/') ? 'video' : 'image';

        $folder = $type === 'video' ? 'salon-videos' : 'salon-media';
        $path   = $request->file('file')->store($folder, 'public');

        $media = $request->user()->salon->media()->create([
            'type'       => $type,
            'path'       => $path,
            'caption'    => $request->caption,
            'sort_order' => $request->user()->salon->media()->max('sort_order') + 1,
        ]);

        return new SalonMediaResource($media);
    }

    public function update(Request $request, SalonMedia $media)
    {
        abort_unless($media->salon_id === $request->user()->salon->id, 403);

        $request->validate(['caption' => 'nullable|string|max:255']);

        $media->update(['caption' => $request->caption]);

        return new SalonMediaResource($media);
    }

    public function destroy(Request $request, SalonMedia $media)
    {
        abort_unless($media->salon_id === $request->user()->salon->id, 403);

        Storage::disk('public')->delete($media->path);
        $media->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
