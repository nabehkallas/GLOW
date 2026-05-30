<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalonServiceResource;
use App\Models\SalonService;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        return SalonServiceResource::collection(
            $request->user()->salon->services()->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'price'            => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:5',
            'category'         => 'nullable|string|max:100',
            'available_from'   => 'nullable|date_format:H:i',
            'available_until'  => 'nullable|date_format:H:i|after:available_from',
        ]);

        return new SalonServiceResource(
            $request->user()->salon->services()->create($data)
        );
    }

    public function show(Request $request, SalonService $service)
    {
        $this->authorizeSalonOwnership($request, $service);

        return new SalonServiceResource($service);
    }

    public function update(Request $request, SalonService $service)
    {
        $this->authorizeSalonOwnership($request, $service);

        $data = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'description'      => 'nullable|string',
            'price'            => 'sometimes|numeric|min:0',
            'duration_minutes' => 'sometimes|integer|min:5',
            'category'         => 'nullable|string|max:100',
            'available_from'   => 'nullable|date_format:H:i',
            'available_until'  => 'nullable|date_format:H:i|after:available_from',
            'is_active'        => 'boolean',
        ]);

        $service->update($data);

        return new SalonServiceResource($service);
    }

    public function destroy(Request $request, SalonService $service)
    {
        $this->authorizeSalonOwnership($request, $service);
        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }

    private function authorizeSalonOwnership(Request $request, SalonService $service): void
    {
        abort_unless($service->salon_id === $request->user()->salon->id, 403, 'Unauthorized.');
    }
}
