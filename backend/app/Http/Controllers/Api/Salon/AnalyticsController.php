<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $salon  = $request->user()->salon;
        $months = max(1, min((int) $request->get('months', 6), 24));

        return response()->json([
            'overview'             => $this->overview($salon),
            'monthly_appointments' => $this->monthlyAppointments($salon, $months),
            'top_services'         => $this->topServices($salon),
            'busiest_days'         => $this->busiestDays($salon),
            'orders_summary'       => $this->ordersSummary($salon),
            'recent_appointments'  => $this->recentAppointments($salon),
        ]);
    }

    private function overview($salon): array
    {
        $appointments = $salon->appointments();

        return [
            'total_appointments'     => $appointments->count(),
            'pending_appointments'   => $appointments->where('status', 'pending')->count(),
            'confirmed_appointments' => $salon->appointments()->where('status', 'confirmed')->count(),
            'completed_appointments' => $salon->appointments()->where('status', 'completed')->count(),
            'cancelled_appointments' => $salon->appointments()->where('status', 'cancelled')->count(),
            'total_revenue'          => (float) $salon->appointments()->where('status', 'completed')->sum('price_at_booking'),
            'this_month_revenue'     => (float) $salon->appointments()
                ->where('status', 'completed')
                ->whereMonth('scheduled_at', now()->month)
                ->whereYear('scheduled_at', now()->year)
                ->sum('price_at_booking'),
            'total_orders'           => $salon->orders()->count(),
            'total_spent_on_products'=> (float) $salon->orders()
                ->whereIn('status', ['confirmed', 'shipped', 'delivered'])
                ->sum('total_amount'),
        ];
    }

    private function monthlyAppointments($salon, int $months): array
    {
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();

        return $salon->appointments()
            ->where('created_at', '>=', $start)
            ->get()
            ->groupBy(fn($a) => Carbon::parse($a->scheduled_at)->format('Y-m'))
            ->map(fn($group, $month) => [
                'month'   => $month,
                'count'   => $group->count(),
                'revenue' => round($group->where('status', 'completed')->sum('price_at_booking'), 2),
            ])
            ->values()
            ->toArray();
    }

    private function topServices($salon, int $limit = 5): array
    {
        return $salon->services()
            ->withCount('appointments')
            ->withSum(['appointments as revenue' => fn($q) => $q->where('status', 'completed')], 'price_at_booking')
            ->orderByDesc('appointments_count')
            ->limit($limit)
            ->get(['id', 'name', 'price', 'category'])
            ->toArray();
    }

    private function busiestDays($salon): array
    {
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return $salon->appointments()
            ->where('status', 'completed')
            ->get(['scheduled_at'])
            ->groupBy(fn($a) => Carbon::parse($a->scheduled_at)->dayOfWeek)
            ->map(fn($group, $dayIndex) => [
                'day'   => $days[$dayIndex],
                'count' => $group->count(),
            ])
            ->sortByDesc('count')
            ->values()
            ->toArray();
    }

    private function ordersSummary($salon): array
    {
        return $salon->orders()
            ->selectRaw('status, count(*) as count, sum(total_amount) as total')
            ->groupBy('status')
            ->get()
            ->keyBy('status')
            ->toArray();
    }

    private function recentAppointments($salon, int $limit = 10): array
    {
        return $salon->appointments()
            ->with('client:id,name,phone', 'service:id,name,price')
            ->orderByDesc('scheduled_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }
}
