<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Salon;
use Illuminate\Http\Request;

class SalonController extends Controller
{
    public function index(Request $request)
    {
        $salons = Salon::with('user')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15);

        return response()->json($salons);
    }

    public function show(Salon $salon)
    {
        return response()->json($salon->load('user', 'services'));
    }

    public function approve(Salon $salon)
    {
        $salon->update(['status' => 'approved', 'rejection_reason' => null]);

        return response()->json(['message' => 'Salon approved.', 'salon' => $salon]);
    }

    public function reject(Request $request, Salon $salon)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $salon->update(['status' => 'rejected', 'rejection_reason' => $request->reason]);

        return response()->json(['message' => 'Salon rejected.', 'salon' => $salon]);
    }

    public function destroy(Salon $salon)
    {
        $salon->delete();

        return response()->json(['message' => 'Salon removed.']);
    }
}
