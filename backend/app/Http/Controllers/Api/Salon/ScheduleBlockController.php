<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Http\Resources\ScheduleBlockResource;
use App\Models\Appointment;
use App\Models\SalonService;
use App\Models\ScheduleBlock;
use App\Models\WorkingHour;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ScheduleBlockController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date',
        ]);

        $blocks = $request->user()->salon
            ->scheduleBlocks()
            ->with('service:id,name')
            ->when($request->date_from, fn($q) => $q->whereDate('starts_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('starts_at', '<=', $request->date_to))
            ->orderBy('starts_at')
            ->get();

        return ScheduleBlockResource::collection($blocks);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'starts_at'         => 'required|date',
            'duration_minutes'  => 'required|integer|in:15,30,45,60,75,90,105,120,135,150,165,180',
            'salon_service_id'  => 'nullable|exists:salon_services,id',
            'note'              => 'nullable|string|max:500',
        ]);

        $salon      = $request->user()->salon;
        $startsAt   = Carbon::parse($data['starts_at']);
        $endsAt     = $startsAt->copy()->addMinutes($data['duration_minutes']);

        $service = null;
        if (!empty($data['salon_service_id'])) {
            $service = SalonService::where('id', $data['salon_service_id'])
                ->where('salon_id', $salon->id)
                ->firstOrFail();
        }
        $newServiceId = $service?->id;

        $workingHour = WorkingHour::where('salon_id', $salon->id)
            ->where('day_of_week', $startsAt->dayOfWeek)
            ->first();

        abort_if(!$workingHour || $workingHour->is_closed, 422, 'The salon is closed on this day.');

        $open  = Carbon::parse($startsAt->toDateString() . ' ' . $workingHour->open_time);
        $close = Carbon::parse($startsAt->toDateString() . ' ' . $workingHour->close_time);

        abort_if(
            $startsAt->lt($open) || $endsAt->gt($close),
            422,
            "Block must be within working hours ({$workingHour->open_time} – {$workingHour->close_time})."
        );

        $overlapsAppointment = Appointment::with('service:id,duration_minutes')
            ->where('salon_id', $salon->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereDate('scheduled_at', $startsAt->toDateString())
            ->get()
            ->contains(function ($appt) use ($startsAt, $endsAt, $newServiceId) {
                $duration = $appt->service?->duration_minutes ?? $appt->duration_minutes;
                if (!$duration) return false;
                $apptStart = Carbon::parse($appt->scheduled_at);
                $apptEnd   = $apptStart->copy()->addMinutes($duration);
                if (!($startsAt->lt($apptEnd) && $endsAt->gt($apptStart))) return false;

                // A whole-salon block conflicts with any appointment; a service-specific
                // block only conflicts with appointments booked for that same service.
                if ($newServiceId === null) return true;
                return $appt->salon_service_id === $newServiceId;
            });

        abort_if($overlapsAppointment, 422, 'This time overlaps an existing appointment.');

        $overlapsBlock = ScheduleBlock::where('salon_id', $salon->id)
            ->whereDate('starts_at', $startsAt->toDateString())
            ->get()
            ->contains(function ($block) use ($startsAt, $endsAt, $newServiceId) {
                $blockEnd = $block->starts_at->copy()->addMinutes($block->duration_minutes);
                if (!($startsAt->lt($blockEnd) && $endsAt->gt($block->starts_at))) return false;

                // Either side being a whole-salon block (null) always conflicts;
                // two service-specific blocks only conflict if they're the same service.
                if ($newServiceId === null || $block->salon_service_id === null) return true;
                return $block->salon_service_id === $newServiceId;
            });

        abort_if($overlapsBlock, 422, 'This time is already blocked.');

        $block = ScheduleBlock::create([
            'salon_id'         => $salon->id,
            'salon_service_id' => $newServiceId,
            'starts_at'        => $startsAt,
            'duration_minutes' => $data['duration_minutes'],
            'note'             => $data['note'] ?? null,
        ]);

        return new ScheduleBlockResource($block->load('service:id,name'));
    }

    public function destroy(Request $request, ScheduleBlock $scheduleBlock)
    {
        abort_unless($scheduleBlock->salon_id === $request->user()->salon->id, 403);

        $scheduleBlock->delete();

        return response()->json(['message' => 'Block removed.']);
    }
}
