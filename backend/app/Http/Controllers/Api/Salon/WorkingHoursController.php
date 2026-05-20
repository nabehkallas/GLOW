<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Models\WorkingHour;
use Illuminate\Http\Request;

class WorkingHoursController extends Controller
{
    public function index(Request $request)
    {
        $hours = $request->user()->salon
            ->workingHours()
            ->get()
            ->map(fn($wh) => array_merge($wh->toArray(), ['day_name' => $wh->day_name]));

        return response()->json($hours);
    }

    /**
     * Upsert the full weekly schedule in one call.
     * Expects an array of 7 day entries.
     */
    public function upsert(Request $request)
    {
        $request->validate([
            'schedule'               => 'required|array|size:7',
            'schedule.*.day_of_week' => 'required|integer|between:0,6',
            'schedule.*.is_closed'   => 'required|boolean',
            'schedule.*.open_time'   => 'nullable|date_format:H:i|required_if:schedule.*.is_closed,false',
            'schedule.*.close_time'  => 'nullable|date_format:H:i|required_if:schedule.*.is_closed,false|after:schedule.*.open_time',
        ]);

        $salon = $request->user()->salon;

        foreach ($request->schedule as $day) {
            WorkingHour::updateOrCreate(
                ['salon_id' => $salon->id, 'day_of_week' => $day['day_of_week']],
                [
                    'is_closed'  => $day['is_closed'],
                    'open_time'  => $day['is_closed'] ? null : $day['open_time'],
                    'close_time' => $day['is_closed'] ? null : $day['close_time'],
                ]
            );
        }

        $hours = $salon->workingHours()->get()
            ->map(fn($wh) => array_merge($wh->toArray(), ['day_name' => $wh->day_name]));

        return response()->json($hours);
    }

    /**
     * Update a single day.
     */
    public function update(Request $request, int $dayOfWeek)
    {
        abort_if($dayOfWeek < 0 || $dayOfWeek > 6, 422, 'day_of_week must be between 0 and 6.');

        $data = $request->validate([
            'is_closed'  => 'required|boolean',
            'open_time'  => 'nullable|date_format:H:i|required_if:is_closed,false',
            'close_time' => 'nullable|date_format:H:i|required_if:is_closed,false|after:open_time',
        ]);

        $salon = $request->user()->salon;

        $wh = WorkingHour::updateOrCreate(
            ['salon_id' => $salon->id, 'day_of_week' => $dayOfWeek],
            [
                'is_closed'  => $data['is_closed'],
                'open_time'  => $data['is_closed'] ? null : $data['open_time'],
                'close_time' => $data['is_closed'] ? null : $data['close_time'],
            ]
        );

        return response()->json(array_merge($wh->toArray(), ['day_name' => $wh->day_name]));
    }
}
