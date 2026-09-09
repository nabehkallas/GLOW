<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\ScheduleBlock;
use App\Models\SalonService;
use App\Models\WorkingHour;
use App\Notifications\AppointmentStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date',
        ]);

        $appointments = $request->user()->salon
            ->appointments()
            ->with('client', 'service')
            ->when($request->status && $request->status !== 'all', fn($q) => $q->where('status', $request->status))
            ->when($request->date_from, fn($q) => $q->whereDate('scheduled_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('scheduled_at', '<=', $request->date_to))
            ->when($request->search, function ($q) use ($request) {
                $term = $request->search;
                $q->where(function ($q2) use ($term) {
                    $q2->where('client_name', 'like', "%{$term}%")
                        ->orWhere('client_phone', 'like', "%{$term}%")
                        ->orWhereHas('client', fn($q3) => $q3->where('name', 'like', "%{$term}%")->orWhere('phone', 'like', "%{$term}%"));
                });
            })
            ->orderBy('scheduled_at')
            ->get();

        return AppointmentResource::collection($appointments);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'salon_service_id' => 'nullable|exists:salon_services,id',
            'duration_minutes' => 'nullable|integer|in:15,30,45,60,75,90,105,120,135,150,165,180',
            'scheduled_at'     => 'required|date',
            'client_name'      => 'required|string|max:255',
            'client_phone'     => 'required|string|max:30',
            'notes'            => 'nullable|string|max:500',
        ]);

        $salon       = $request->user()->salon;
        $scheduledAt = Carbon::parse($data['scheduled_at']);

        $service      = null;
        $scheduledEnd = null;

        if (!empty($data['salon_service_id'])) {
            $service = SalonService::where('id', $data['salon_service_id'])
                ->where('salon_id', $salon->id)
                ->firstOrFail();
            $scheduledEnd = $scheduledAt->copy()->addMinutes($service->duration_minutes);
        } elseif (!empty($data['duration_minutes'])) {
            $scheduledEnd = $scheduledAt->copy()->addMinutes($data['duration_minutes']);
        }

        // Check working hours (always — at least verify salon is open that day)
        $workingHour = WorkingHour::where('salon_id', $salon->id)
            ->where('day_of_week', $scheduledAt->dayOfWeek)
            ->first();

        abort_if(!$workingHour || $workingHour->is_closed, 422, 'The salon is closed on this day.');

        // Time bounds + capacity when duration is known (service or manual)
        if ($scheduledEnd) {
            $open  = Carbon::parse($scheduledAt->toDateString() . ' ' . $workingHour->open_time);
            $close = Carbon::parse($scheduledAt->toDateString() . ' ' . $workingHour->close_time);

            abort_if(
                $scheduledAt->lt($open) || $scheduledEnd->gt($close),
                422,
                "Appointment must be within working hours ({$workingHour->open_time} – {$workingHour->close_time})."
            );

            $capacity = $salon->capacity ?? 1;

            $overlappingCount = Appointment::with('service:id,duration_minutes')
                ->where('salon_id', $salon->id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->whereDate('scheduled_at', $scheduledAt->toDateString())
                ->get()
                ->filter(function ($appt) use ($scheduledAt, $scheduledEnd) {
                    $duration = $appt->service?->duration_minutes ?? $appt->duration_minutes;
                    if (!$duration) return false;
                    $apptStart = Carbon::parse($appt->scheduled_at);
                    $apptEnd   = $apptStart->copy()->addMinutes($duration);
                    return $scheduledAt->lt($apptEnd) && $scheduledEnd->gt($apptStart);
                })
                ->count();

            abort_if($overlappingCount >= $capacity, 422, 'This time slot is fully booked.');

            $overlapsBlock = ScheduleBlock::where('salon_id', $salon->id)
                ->whereDate('starts_at', $scheduledAt->toDateString())
                ->where(fn($q) => $q->whereNull('salon_service_id')->orWhere('salon_service_id', $service?->id))
                ->get()
                ->contains(function ($block) use ($scheduledAt, $scheduledEnd) {
                    $blockEnd = $block->starts_at->copy()->addMinutes($block->duration_minutes);
                    return $scheduledAt->lt($blockEnd) && $scheduledEnd->gt($block->starts_at);
                });

            abort_if($overlapsBlock, 422, 'This time is unavailable.');
        }

        $appointment = Appointment::create([
            'salon_id'         => $salon->id,
            'salon_service_id' => $service?->id,
            'duration_minutes' => $service ? null : ($data['duration_minutes'] ?? null),
            'scheduled_at'     => $scheduledAt,
            'client_name'      => $data['client_name'],
            'client_phone'     => $data['client_phone'],
            'notes'            => $data['notes'] ?? null,
            'price_at_booking' => $service?->price ?? 0,
            'status'           => 'confirmed',
            'source'           => 'manual',
            'client_id'        => null,
        ]);

        return new AppointmentResource($appointment->load('service'));
    }

    public function confirm(Request $request, Appointment $appointment)
    {
        abort_unless($appointment->salon_id === $request->user()->salon->id, 403);
        abort_unless($appointment->status === 'pending', 422, 'Only pending appointments can be confirmed.');

        $appointment->update(['status' => 'confirmed']);
        $appointment->load('client', 'service');

        if ($appointment->client) {
            $appointment->client->notify(new AppointmentStatusChanged($appointment, 'confirmed'));
        }

        return new AppointmentResource($appointment);
    }

    public function complete(Request $request, Appointment $appointment)
    {
        abort_unless($appointment->salon_id === $request->user()->salon->id, 403);
        abort_unless($appointment->status === 'confirmed', 422, 'Only confirmed appointments can be completed.');

        $data = $request->validate([
            'price_at_booking' => 'sometimes|numeric|min:0',
            'notes'            => 'sometimes|nullable|string|max:500',
        ]);

        $appointment->update([...$data, 'status' => 'completed']);
        $appointment->load('client', 'service');

        if ($appointment->client) {
            $appointment->client->notify(new AppointmentStatusChanged($appointment, 'completed'));
        }

        return new AppointmentResource($appointment);
    }

    public function cancel(Request $request, Appointment $appointment)
    {
        abort_unless($appointment->salon_id === $request->user()->salon->id, 403);
        abort_unless(in_array($appointment->status, ['pending', 'confirmed']), 422, 'Cannot cancel this appointment.');

        $appointment->update(['status' => 'cancelled']);
        $appointment->load('client', 'service');

        if ($appointment->client) {
            $appointment->client->notify(new AppointmentStatusChanged($appointment, 'cancelled'));
        }

        return new AppointmentResource($appointment);
    }

    public function approveCancellation(Request $request, Appointment $appointment)
    {
        abort_unless($appointment->salon_id === $request->user()->salon->id, 403);
        abort_unless($appointment->status === 'cancellation_requested', 422, 'No pending cancellation request for this appointment.');

        $appointment->update(['status' => 'cancelled']);
        $appointment->load('client', 'service');

        if ($appointment->client) {
            $appointment->client->notify(new AppointmentStatusChanged($appointment, 'cancelled'));
        }

        return new AppointmentResource($appointment);
    }

    public function denyCancellation(Request $request, Appointment $appointment)
    {
        abort_unless($appointment->salon_id === $request->user()->salon->id, 403);
        abort_unless($appointment->status === 'cancellation_requested', 422, 'No pending cancellation request for this appointment.');

        $appointment->update(['status' => 'confirmed', 'cancellation_reason' => null]);
        $appointment->load('client', 'service');

        if ($appointment->client) {
            $appointment->client->notify(new AppointmentStatusChanged($appointment, 'cancellation_denied'));
        }

        return new AppointmentResource($appointment);
    }
}
