<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalonMediaResource;
use App\Http\Resources\SalonResource;
use App\Models\Salon;
use Illuminate\Http\Request;

class SalonController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
        ]);

        $salons = Salon::where('status', 'approved')
            ->when($request->city, fn($q) => $q->where('city', $request->city))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->with('services')
            ->get();

        $hasLocation = $request->filled('lat') && $request->filled('lng');

        $salons = $salons->map(function (Salon $salon) use ($request, $hasLocation) {
            $salon->distance_km = $hasLocation
                ? $salon->distanceFrom((float) $request->lat, (float) $request->lng)
                : null;
            return $salon;
        });

        if ($hasLocation) {
            $salons = $salons->sortBy('distance_km')->values();
        }

        return SalonResource::collection($salons);
    }

    public function show(Request $request, Salon $salon)
    {
        abort_unless($salon->status === 'approved', 404);

        $request->validate([
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
        ]);

        $salon->loadMissing('services', 'workingHours', 'user');

        $salon->distance_km = ($request->filled('lat') && $request->filled('lng'))
            ? $salon->distanceFrom((float) $request->lat, (float) $request->lng)
            : null;

        return new SalonResource($salon);
    }

    public function media(Salon $salon)
    {
        abort_unless($salon->status === 'approved', 404);

        $media = $salon->media()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return SalonMediaResource::collection($media);
    }
}
