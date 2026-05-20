<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $user   = $request->user();
        $months = max(1, min((int) $request->get('months', 6), 24));

        return response()->json([
            'overview'          => $this->overview($user),
            'monthly_activity'  => $this->monthlyActivity($user, $months),
            'favourite_salons'  => $this->favouriteSalons($user),
            'recent_appointments' => $this->recentAppointments($user),
            'spending_by_category' => $this->spendingByCategory($user),
        ]);
    }

    private function overview($user): array
    {
        $appointments = $user->appointments();

        return [
            'total_appointments'     => $appointments->count(),
            'pending_appointments'   => $appointments->where('status', 'pending')->count(),
            'confirmed_appointments' => $user->appointments()->where('status', 'confirmed')->count(),
            'completed_appointments' => $user->appointments()->where('status', 'completed')->count(),
            'cancelled_appointments' => $user->appointments()->where('status', 'cancelled')->count(),
            'total_spent'            => (float) $user->appointments()
                ->where('status', 'completed')
                ->sum('price_at_booking'),
            'this_month_spent'       => (float) $user->appointments()
                ->where('status', 'completed')
                ->whereMonth('scheduled_at', now()->month)
                ->whereYear('scheduled_at', now()->year)
                ->sum('price_at_booking'),
            'unique_salons_visited'  => $user->appointments()
                ->where('status', 'completed')
                ->distinct('salon_id')
                ->count('salon_id'),
        ];
    }

    private function monthlyActivity($user, int $months): array
    {
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();

        return $user->appointments()
            ->where('created_at', '>=', $start)
            ->get()
            ->groupBy(fn($a) => Carbon::parse($a->scheduled_at)->format('Y-m'))
            ->map(fn($group, $month) => [
                'month'  => $month,
                'count'  => $group->count(),
                'spent'  => round($group->where('status', 'completed')->sum('price_at_booking'), 2),
            ])
            ->values()
            ->toArray();
    }

    private function favouriteSalons($user, int $limit = 5): array
    {
        return $user->appointments()
            ->where('status', 'completed')
            ->with('salon:id,name,city,address')
            ->get()
            ->groupBy('salon_id')
            ->map(fn($group) => [
                'salon'       => $group->first()->salon,
                'visits'      => $group->count(),
                'total_spent' => round($group->sum('price_at_booking'), 2),
                'last_visit'  => Carbon::parse($group->max('scheduled_at'))->toDateString(),
            ])
            ->sortByDesc('visits')
            ->values()
            ->take($limit)
            ->toArray();
    }

    private function recentAppointments($user, int $limit = 10): array
    {
        return $user->appointments()
            ->with('salon:id,name,city', 'service:id,name,price')
            ->orderByDesc('scheduled_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    private function spendingByCategory($user): array
    {
        return $user->appointments()
            ->where('status', 'completed')
            ->with('service:id,category,price')
            ->get()
            ->groupBy(fn($a) => $a->service?->category ?? 'Uncategorized')
            ->map(fn($group, $category) => [
                'category'    => $category,
                'count'       => $group->count(),
                'total_spent' => round($group->sum('price_at_booking'), 2),
            ])
            ->sortByDesc('total_spent')
            ->values()
            ->toArray();
    }
}
