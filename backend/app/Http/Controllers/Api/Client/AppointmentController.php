<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\SalonService;
use App\Models\WorkingHour;
use App\Notifications\AppointmentBooked;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $appointments = $request->user()
            ->appointments()
            ->with('salon', 'service')
            ->when($request->status === 'upcoming', fn($q) => $q->whereIn('status', ['pending', 'confirmed']))
            ->when($request->status === 'past',     fn($q) => $q->whereIn('status', ['completed', 'cancelled']))
            ->when($request->status && !in_array($request->status, ['upcoming', 'past']),
                fn($q) => $q->where('status', $request->status))
            ->orderBy('scheduled_at')
            ->paginate(15);

        return AppointmentResource::collection($appointments);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'salon_service_id' => 'required|exists:salon_services,id',
            'scheduled_at'     => 'required|date|after:now',
            'notes'            => 'nullable|string|max:500',
        ]);

        $service      = SalonService::with('salon')->findOrFail($data['salon_service_id']);
        $scheduledAt  = Carbon::parse($data['scheduled_at']);
        $scheduledEnd = $scheduledAt->copy()->addMinutes($service->duration_minutes);

        abort_unless($service->is_active, 422, 'This service is not available.');
        abort_unless($service->salon->isApproved(), 422, 'This salon is not accepting bookings.');

        $workingHour = WorkingHour::where('salon_id', $service->salon_id)
            ->where('day_of_week', $scheduledAt->dayOfWeek)
            ->first();

        abort_if(
            ! $workingHour || $workingHour->is_closed,
            422,
            'The salon is closed on this day.'
        );

        $open  = Carbon::parse($scheduledAt->toDateString() . ' ' . $workingHour->open_time);
        $close = Carbon::parse($scheduledAt->toDateString() . ' ' . $workingHour->close_time);

        abort_if(
            $scheduledAt->lt($open) || $scheduledEnd->gt($close),
            422,
            "Appointment must be within working hours ({$workingHour->open_time} – {$workingHour->close_time})."
        );

        // Check service-level availability hours
        if ($service->available_from) {
            $serviceOpen = Carbon::parse($scheduledAt->toDateString() . ' ' . $service->available_from);
            abort_if($scheduledAt->lt($serviceOpen), 422, "This service is only available from {$service->available_from}.");
        }
        if ($service->available_until) {
            $serviceClose = Carbon::parse($scheduledAt->toDateString() . ' ' . $service->available_until);
            abort_if($scheduledEnd->gt($serviceClose), 422, "This service must finish by {$service->available_until}.");
        }

        $capacity = $service->salon->capacity ?? 1;

        $overlappingCount = Appointment::with('service:id,duration_minutes')
            ->where('salon_id', $service->salon_id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereDate('scheduled_at', $scheduledAt->toDateString())
            ->get()
            ->filter(function ($appt) use ($scheduledAt, $scheduledEnd) {
                $apptStart = Carbon::parse($appt->scheduled_at);
                $apptEnd   = $apptStart->copy()->addMinutes($appt->service->duration_minutes);
                return $scheduledAt->lt($apptEnd) && $scheduledEnd->gt($apptStart);
            })
            ->count();

        abort_if($overlappingCount >= $capacity, 422, 'This time slot is fully booked. Please choose another time.');

        $appointment = Appointment::create([
            'client_id'        => $request->user()->id,
            'salon_id'         => $service->salon_id,
            'salon_service_id' => $service->id,
            'scheduled_at'     => $scheduledAt,
            'notes'            => $data['notes'] ?? null,
            'price_at_booking' => $service->price,
            'status'           => 'pending',
        ]);

        $appointment->load('client', 'service');
        $service->salon->user->notify(new AppointmentBooked($appointment));

        return new AppointmentResource($appointment->load('salon', 'service'));
    }

    public function show(Request $request, Appointment $appointment)
    {
        abort_unless($appointment->client_id === $request->user()->id, 403);

        return new AppointmentResource($appointment->load('salon', 'service'));
    }

    public function cancel(Request $request, Appointment $appointment)
    {
        abort_unless($appointment->client_id === $request->user()->id, 403);
        abort_unless(in_array($appointment->status, ['pending', 'confirmed']), 422, 'Cannot cancel this appointment.');

        $appointment->update(['status' => 'cancelled']);

        return new AppointmentResource($appointment->load('salon', 'service'));
    }
}
