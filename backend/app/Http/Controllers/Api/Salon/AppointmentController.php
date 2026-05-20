<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $appointments = $request->user()->salon
            ->appointments()
            ->with('client', 'service')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderBy('scheduled_at')
            ->paginate(15);

        return response()->json($appointments);
    }

    public function confirm(Request $request, Appointment $appointment)
    {
        abort_unless($appointment->salon_id === $request->user()->salon->id, 403);
        abort_unless($appointment->status === 'pending', 422, 'Only pending appointments can be confirmed.');

        $appointment->update(['status' => 'confirmed']);

        return response()->json($appointment->load('client', 'service'));
    }

    public function complete(Request $request, Appointment $appointment)
    {
        abort_unless($appointment->salon_id === $request->user()->salon->id, 403);
        abort_unless($appointment->status === 'confirmed', 422, 'Only confirmed appointments can be completed.');

        $appointment->update(['status' => 'completed']);

        return response()->json($appointment->load('client', 'service'));
    }

    public function cancel(Request $request, Appointment $appointment)
    {
        abort_unless($appointment->salon_id === $request->user()->salon->id, 403);
        abort_unless(in_array($appointment->status, ['pending', 'confirmed']), 422, 'Cannot cancel this appointment.');

        $appointment->update(['status' => 'cancelled']);

        return response()->json($appointment->load('client', 'service'));
    }
}
