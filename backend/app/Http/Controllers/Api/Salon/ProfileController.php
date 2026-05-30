<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return new UserResource($request->user()->load('salon.services'));
    }

    public function update(Request $request)
    {
        $salon = $request->user()->salon;

        $data = $request->validate([
            'salon_name'  => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'address'     => 'sometimes|string',
            'city'        => 'sometimes|string|max:100',
            'latitude'    => 'nullable|numeric|between:-90,90',
            'longitude'   => 'nullable|numeric|between:-180,180',
            'phone'       => 'nullable|string|max:20',
            'capacity'    => 'sometimes|integer|min:1|max:20',
        ]);

        if (isset($data['salon_name'])) {
            $salon->update(['name' => $data['salon_name']]);
        }

        $salonData = array_filter([
            'description' => $data['description'] ?? null,
            'address'     => $data['address'] ?? null,
            'city'        => $data['city'] ?? null,
            'latitude'    => $data['latitude'] ?? null,
            'longitude'   => $data['longitude'] ?? null,
        ], fn($v) => $v !== null);

        if (isset($data['capacity'])) {
            $salonData['capacity'] = $data['capacity'];
        }

        $salon->update($salonData);

        if (isset($data['phone'])) {
            $request->user()->update(['phone' => $data['phone']]);
        }

        return new UserResource($request->user()->fresh()->load('salon'));
    }
}
