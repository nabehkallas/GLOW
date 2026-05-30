<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $salonId = $request->user()->salon->id;

        // App clients — aggregate by client_id
        $appRows = Appointment::where('salon_id', $salonId)
            ->whereNotNull('client_id')
            ->selectRaw('
                client_id,
                COUNT(*) as total_visits,
                SUM(status = "completed") as completed_visits,
                SUM(status = "cancelled") as cancelled_visits,
                SUM(CASE WHEN status = "completed" THEN price_at_booking ELSE 0 END) as total_spent,
                MAX(scheduled_at) as last_visit,
                MIN(scheduled_at) as first_visit
            ')
            ->groupBy('client_id')
            ->get();

        $userIds  = $appRows->pluck('client_id')->unique();
        $users    = User::whereIn('id', $userIds)->get()->keyBy('id');

        $appClients = $appRows->map(fn($row) => [
            'type'             => 'app',
            'user_id'          => $row->client_id,
            'name'             => $users[$row->client_id]?->name ?? '—',
            'email'            => $users[$row->client_id]?->email ?? null,
            'total_visits'     => (int) $row->total_visits,
            'completed_visits' => (int) $row->completed_visits,
            'cancelled_visits' => (int) $row->cancelled_visits,
            'total_spent'      => (float) $row->total_spent,
            'last_visit'       => $row->last_visit,
            'first_visit'      => $row->first_visit,
        ]);

        // Walk-in clients — aggregate by client_name
        $walkInRows = Appointment::where('salon_id', $salonId)
            ->whereNull('client_id')
            ->whereNotNull('client_name')
            ->selectRaw('
                client_name,
                COUNT(*) as total_visits,
                SUM(status = "completed") as completed_visits,
                SUM(status = "cancelled") as cancelled_visits,
                SUM(CASE WHEN status = "completed" THEN price_at_booking ELSE 0 END) as total_spent,
                MAX(scheduled_at) as last_visit,
                MIN(scheduled_at) as first_visit
            ')
            ->groupBy('client_name')
            ->get();

        $walkInClients = $walkInRows->map(fn($row) => [
            'type'             => 'walkin',
            'name'             => $row->client_name,
            'email'            => null,
            'total_visits'     => (int) $row->total_visits,
            'completed_visits' => (int) $row->completed_visits,
            'cancelled_visits' => (int) $row->cancelled_visits,
            'total_spent'      => (float) $row->total_spent,
            'last_visit'       => $row->last_visit,
            'first_visit'      => $row->first_visit,
        ]);

        $all = $appClients->concat($walkInClients)
            ->sortByDesc('last_visit')
            ->values();

        return response()->json(['data' => $all]);
    }

    public function show(Request $request, int $userId)
    {
        $salonId = $request->user()->salon->id;

        $appointments = Appointment::where('salon_id', $salonId)
            ->where('client_id', $userId)
            ->with('service:id,name,price,duration_minutes')
            ->orderByDesc('scheduled_at')
            ->get();

        $user = User::find($userId);

        return response()->json([
            'data' => [
                'type'             => 'app',
                'user_id'          => $userId,
                'name'             => $user?->name ?? '—',
                'email'            => $user?->email,
                'stats'            => $this->buildStats($appointments),
                'appointments'     => AppointmentResource::collection($appointments),
            ],
        ]);
    }

    public function walkin(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $salonId = $request->user()->salon->id;

        $appointments = Appointment::where('salon_id', $salonId)
            ->whereNull('client_id')
            ->where('client_name', $request->name)
            ->with('service:id,name,price,duration_minutes')
            ->orderByDesc('scheduled_at')
            ->get();

        return response()->json([
            'data' => [
                'type'         => 'walkin',
                'name'         => $request->name,
                'email'        => null,
                'stats'        => $this->buildStats($appointments),
                'appointments' => AppointmentResource::collection($appointments),
            ],
        ]);
    }

    private function buildStats($appointments): array
    {
        return [
            'total_visits'     => $appointments->count(),
            'completed_visits' => $appointments->where('status', 'completed')->count(),
            'cancelled_visits' => $appointments->where('status', 'cancelled')->count(),
            'pending_visits'   => $appointments->whereIn('status', ['pending', 'confirmed'])->count(),
            'total_spent'      => (float) $appointments->where('status', 'completed')->sum('price_at_booking'),
            'last_visit'       => $appointments->first()?->scheduled_at?->toDateTimeString(),
            'first_visit'      => $appointments->last()?->scheduled_at?->toDateTimeString(),
        ];
    }
}
