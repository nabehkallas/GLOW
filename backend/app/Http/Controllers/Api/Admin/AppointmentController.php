<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AppointmentController extends Controller
{
    /**
     * Cross-salon appointment list, defaulting to "pending" so admin can spot ones a
     * salon might have forgotten to confirm/act on — pending appointments whose
     * scheduled time has already passed ("stale") are sorted first.
     */
    public function index(Request $request)
    {
        $limit = max(1, min((int) $request->get('limit', 20), 100));
        $now   = Carbon::now();

        $appointments = Appointment::with('client', 'salon', 'service')
            ->when($request->status, fn($q) => $q->where('status', $request->status), fn($q) => $q->where('status', 'pending'))
            ->get()
            ->map(function ($a) use ($now) {
                $resource = (new AppointmentResource($a))->toArray(request());
                $resource['is_stale'] = $a->status === 'pending' && $a->scheduled_at->lt($now);
                return $resource;
            })
            // Stale (overdue-and-still-pending) first, then earliest-scheduled first within each group.
            ->sortBy(fn($a) => ($a['is_stale'] ? '0' : '1') . $a['scheduled_at'])
            ->values()
            ->take($limit);

        return response()->json(['data' => $appointments]);
    }
}
