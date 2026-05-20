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

        // Salon hasn't set working hours yet or is closed that day
        if (! $workingHour || $workingHour->is_closed) {
            return response()->json([
                'date'          => $date->toDateString(),
                'day'           => $date->format('l'),
                'is_open'       => false,
                'working_hours' => null,
                'slots'         => [],
            ]);
        }

        $slots = $this->generateSlots(
            $salon,
            $date,
            $workingHour,
            $service->duration_minutes
        );

        return response()->json([
            'date'          => $date->toDateString(),
            'day'           => $date->format('l'),
            'is_open'       => true,
            'working_hours' => [
                'open'  => $workingHour->open_time,
                'close' => $workingHour->close_time,
            ],
            'service'       => [
                'id'               => $service->id,
                'name'             => $service->name,
                'duration_minutes' => $service->duration_minutes,
                'price'            => $service->price,
            ],
            'slots'         => $slots,
        ]);
    }

    private function generateSlots(Salon $salon, Carbon $date, WorkingHour $wh, int $durationMinutes): array
    {
        $open  = Carbon::parse($date->toDateString() . ' ' . $wh->open_time);
        $close = Carbon::parse($date->toDateString() . ' ' . $wh->close_time);
        $now   = Carbon::now();

        // Fetch existing pending/confirmed appointments for this salon on this date, with service duration
        $bookedSlots = Appointment::with('service:id,duration_minutes')
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

        while ($cursor->copy()->addMinutes($durationMinutes)->lte($close)) {
            $slotStart = $cursor->copy();
            $slotEnd   = $cursor->copy()->addMinutes($durationMinutes);

            $isAvailable = ! $bookedSlots->contains(
                fn($booked) => $slotStart->lt($booked['end']) && $slotEnd->gt($booked['start'])
            );

            // Past slots on today are unavailable
            if ($date->isToday() && $slotStart->lte($now)) {
                $isAvailable = false;
            }

            $slots[] = [
                'time'      => $slotStart->format('H:i'),
                'available' => $isAvailable,
            ];

            $cursor->addMinutes($durationMinutes);
        }

        return $slots;
    }
}
