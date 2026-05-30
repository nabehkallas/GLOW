<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalonResource;
use App\Models\Salon;
use App\Notifications\SalonApproved;
use App\Notifications\SalonRejected;
use Illuminate\Http\Request;

class SalonController extends Controller
{
    public function index(Request $request)
    {
        $salons = Salon::with('user')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15);

        return SalonResource::collection($salons);
    }

    public function show(Salon $salon)
    {
        return new SalonResource($salon->load('user', 'services'));
    }

    public function approve(Salon $salon)
    {
        $salon->update(['status' => 'approved', 'rejection_reason' => null]);
        $salon->user->notify(new SalonApproved($salon));

        return response()->json(['message' => 'Salon approved.', 'salon' => new SalonResource($salon)]);
    }

    public function reject(Request $request, Salon $salon)
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        $salon->update(['status' => 'rejected', 'rejection_reason' => $request->reason]);
        $salon->user->notify(new SalonRejected($salon, $request->reason));

        return response()->json(['message' => 'Salon rejected.', 'salon' => new SalonResource($salon)]);
    }

    public function destroy(Salon $salon)
    {
        $salon->delete();

        return response()->json(['message' => 'Salon removed.']);
    }
}
