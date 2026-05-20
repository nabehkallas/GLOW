<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
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
            $data = $salon->toArray();
            $data['distance_km'] = $hasLocation
                ? $salon->distanceFrom((float) $request->lat, (float) $request->lng)
                : null;
            return $data;
        });

        if ($hasLocation) {
            $salons = $salons->sortBy('distance_km')->values();
        }

        return response()->json($salons);
    }

    public function show(Request $request, Salon $salon)
    {
        abort_unless($salon->status === 'approved', 404);

        $request->validate([
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
        ]);

        $data = $salon->load('services')->toArray();
        $data['distance_km'] = ($request->filled('lat') && $request->filled('lng'))
            ? $salon->distanceFrom((float) $request->lat, (float) $request->lng)
            : null;

        return response()->json($data);
    }
}
