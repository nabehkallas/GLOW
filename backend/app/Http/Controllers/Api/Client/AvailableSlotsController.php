<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Salon;
use App\Models\SalonService;
use App\Models\WorkingHour;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AvailableSlotsController extends Controller
{
    public function index(Request $request, Salon $salon)
    {
        abort_unless($salon->status === 'approved', 404);

        $request->validate([
            'date'       => 'required|date|after_or_equal:today',
            'service_id' => 'required|exists:salon_services,id',
        ]);

        $service = SalonService::where('id', $request->service_id)
            ->where('salon_id', $salon->id)
            ->where('is_active', true)
            ->firstOrFail();

        $date      = Carbon::parse($request->date)->startOfDay();
        $dayOfWeek = $date->dayOfWeek;

        $workingHour = WorkingHour::where('salon_id', $salon->id)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (! $workingHour || $workingHour->is_closed) {
            return response()->json([
                'date'          => $date->toDateString(),
                'day'           => $date->format('l'),
                'is_open'       => false,
                'working_hours' => null,
                'service'       => null,
                'slots'         => [],
            ]);
        }

        $slots = $this->generateSlots($salon, $date, $workingHour, $service);

        return response()->json([
            'date'          => $date->toDateString(),
            'day'           => $date->format('l'),
            'is_open'       => true,
            'working_hours' => [
                'open'  => $workingHour->open_time,
                'close' => $workingHour->close_time,
            ],
            'service' => [
                'id'               => $service->id,
                'name'             => $service->name,
                'duration_minutes' => $service->duration_minutes,
                'price'            => $service->price,
                'available_from'   => $service->available_from,
                'available_until'  => $service->available_until,
            ],
            'slots' => $slots,
        ]);
    }

    private function generateSlots(Salon $salon, Carbon $date, WorkingHour $wh, SalonService $service): array
    {
        $duration = $service->duration_minutes;
        $capacity = $salon->capacity ?? 1;

        // Effective window = intersection of salon hours and service hours (if set)
        $open  = Carbon::parse($date->toDateString() . ' ' . $wh->open_time);
        $close = Carbon::parse($date->toDateString() . ' ' . $wh->close_time);

        if ($service->available_from) {
            $serviceOpen = Carbon::parse($date->toDateString() . ' ' . $service->available_from);
            if ($serviceOpen->gt($open)) $open = $serviceOpen;
        }

        if ($service->available_until) {
            $serviceClose = Carbon::parse($date->toDateString() . ' ' . $service->available_until);
            if ($serviceClose->lt($close)) $close = $serviceClose;
        }

        $now = Carbon::now();

        // All pending/confirmed appointments for this salon on this date
        $booked = Appointment::with('service:id,duration_minutes')
            ->where('salon_id', $salon->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereDate('scheduled_at', $date->toDateString())
            ->get()
            ->map(fn($a) => [
                'start' => Carbon::parse($a->scheduled_at),
                'end'   => Carbon::parse($a->scheduled_at)->addMinutes($a->service->duration_minutes),
            ]);

        $slots  = [];
        $cursor = $open->copy();

        while ($cursor->copy()->addMinutes($duration)->lte($close)) {
            $slotStart = $cursor->copy();
            $slotEnd   = $cursor->copy()->addMinutes($duration);

            // Count how many existing appointments overlap this slot
            $overlapping = $booked->filter(
                fn($b) => $slotStart->lt($b['end']) && $slotEnd->gt($b['start'])
            )->count();

            $isAvailable = $overlapping < $capacity;

            // Past slots on today are unavailable
            if ($date->isToday() && $slotStart->lte($now)) {
                $isAvailable = false;
            }

            $slots[] = [
                'time'      => $slotStart->format('H:i'),
                'available' => $isAvailable,
            ];

            $cursor->addMinutes($duration);
        }

        return $slots;
    }
}
