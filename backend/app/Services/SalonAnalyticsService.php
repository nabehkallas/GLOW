<?php

namespace App\Services;

use App\Models\Salon;
use Illuminate\Support\Carbon;

class SalonAnalyticsService
{
    public function compute(Salon $salon, int $months = 6, ?Carbon $from = null, ?Carbon $to = null): array
    {
        $ranged = $from && $to;

        return [
            'overview'             => $this->overview($salon, $from, $to),
            'monthly_revenue'      => $ranged ? $this->rangeRevenue($salon, $from, $to) : $this->monthlyRevenue($salon, $months),
            'monthly_appointments' => $ranged ? $this->rangeAppointments($salon, $from, $to) : $this->monthlyAppointments($salon, $months),
            'top_services'         => $this->topServices($salon, $from, $to),
            'busiest_days'         => $this->busiestDays($salon, $from, $to),
            'orders_summary'       => $this->ordersSummary($salon, $from, $to),
            'recent_appointments'  => $this->recentAppointments($salon, $from, $to),
        ];
    }

    private function overview($salon, ?Carbon $from, ?Carbon $to): array
    {
        $ranged = $from && $to;
        $appointments = fn() => $salon->appointments()->when($ranged, fn($q) => $q->whereBetween('scheduled_at', [$from, $to]));
        $orders       = fn() => $salon->orders()->when($ranged, fn($q) => $q->whereBetween('created_at', [$from, $to]));

        return [
            'total_appointments'     => $appointments()->count(),
            'pending_appointments'   => $appointments()->where('status', 'pending')->count(),
            'confirmed_appointments' => $appointments()->where('status', 'confirmed')->count(),
            'completed_appointments' => $appointments()->where('status', 'completed')->count(),
            'cancelled_appointments' => $appointments()->where('status', 'cancelled')->count(),
            'total_revenue'          => (float) $appointments()->where('status', 'completed')->sum('price_at_booking'),
            // Always the current calendar month, regardless of any date-range filter —
            // a fixed quick-glance figure rather than something the filter should shift.
            'this_month_revenue'     => (float) $salon->appointments()
                ->where('status', 'completed')
                ->whereMonth('scheduled_at', now()->month)
                ->whereYear('scheduled_at', now()->year)
                ->sum('price_at_booking'),
            'total_orders'           => $orders()->count(),
            'total_spent_on_products'=> (float) $orders()->whereIn('status', ['confirmed', 'shipped', 'delivered'])->sum('total_amount'),
        ];
    }

    private function monthlyRevenue($salon, int $months): array
    {
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();

        $apptRevenue = $salon->appointments()
            ->where('status', 'completed')
            ->where('scheduled_at', '>=', $start)
            ->get(['scheduled_at', 'price_at_booking'])
            ->groupBy(fn($a) => Carbon::parse($a->scheduled_at)->format('Y-m'))
            ->map(fn($g) => $g->sum('price_at_booking'));

        $orderRevenue = $salon->orders()
            ->where('status', 'delivered')
            ->where('created_at', '>=', $start)
            ->get(['created_at', 'total_amount'])
            ->groupBy(fn($o) => Carbon::parse($o->created_at)->format('Y-m'))
            ->map(fn($g) => $g->sum('total_amount'));

        $months_list = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $months_list[] = Carbon::now()->subMonths($i)->format('Y-m');
        }

        return collect($months_list)->map(fn($m) => [
            'label'   => $m,
            'revenue' => round(($apptRevenue[$m] ?? 0) + ($orderRevenue[$m] ?? 0), 2),
        ])->toArray();
    }

    private function monthlyAppointments($salon, int $months): array
    {
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();

        return $salon->appointments()
            ->where('created_at', '>=', $start)
            ->get()
            ->groupBy(fn($a) => Carbon::parse($a->scheduled_at)->format('Y-m'))
            ->map(fn($group, $month) => [
                'label'   => $month,
                'count'   => $group->count(),
                'revenue' => round($group->where('status', 'completed')->sum('price_at_booking'), 2),
            ])
            ->values()
            ->toArray();
    }

    // A custom date range can span anywhere from one day to several years, so the
    // bucket size adapts: day buckets for anything up to ~2 months, month buckets
    // beyond that — otherwise a multi-year range would render as an unreadable
    // wall of daily data points.
    private function rangeBuckets(Carbon $from, Carbon $to): array
    {
        $byMonth = $from->diffInDays($to) > 62;
        $format  = $byMonth ? 'Y-m' : 'Y-m-d';

        $buckets = [];
        $cursor  = $from->copy();
        while ($cursor->lte($to)) {
            $buckets[] = $cursor->format($format);
            $cursor    = $byMonth ? $cursor->addMonthNoOverflow() : $cursor->addDay();
        }

        return [array_values(array_unique($buckets)), $format];
    }

    private function rangeRevenue($salon, Carbon $from, Carbon $to): array
    {
        [$buckets, $format] = $this->rangeBuckets($from, $to);

        $apptRevenue = $salon->appointments()
            ->where('status', 'completed')
            ->whereBetween('scheduled_at', [$from, $to])
            ->get(['scheduled_at', 'price_at_booking'])
            ->groupBy(fn($a) => Carbon::parse($a->scheduled_at)->format($format))
            ->map(fn($g) => $g->sum('price_at_booking'));

        $orderRevenue = $salon->orders()
            ->where('status', 'delivered')
            ->whereBetween('created_at', [$from, $to])
            ->get(['created_at', 'total_amount'])
            ->groupBy(fn($o) => Carbon::parse($o->created_at)->format($format))
            ->map(fn($g) => $g->sum('total_amount'));

        return collect($buckets)->map(fn($b) => [
            'label'   => $b,
            'revenue' => round(($apptRevenue[$b] ?? 0) + ($orderRevenue[$b] ?? 0), 2),
        ])->toArray();
    }

    private function rangeAppointments($salon, Carbon $from, Carbon $to): array
    {
        [$buckets, $format] = $this->rangeBuckets($from, $to);

        $grouped = $salon->appointments()
            ->whereBetween('scheduled_at', [$from, $to])
            ->get()
            ->groupBy(fn($a) => Carbon::parse($a->scheduled_at)->format($format));

        return collect($buckets)->map(function ($b) use ($grouped) {
            $group = $grouped->get($b, collect());
            return [
                'label'   => $b,
                'count'   => $group->count(),
                'revenue' => round($group->where('status', 'completed')->sum('price_at_booking'), 2),
            ];
        })->toArray();
    }

    private function topServices($salon, ?Carbon $from, ?Carbon $to, int $limit = 5): array
    {
        $ranged = $from && $to;

        return $salon->services()
            ->withCount(['appointments' => fn($q) => $q->when($ranged, fn($q2) => $q2->whereBetween('scheduled_at', [$from, $to]))])
            ->withSum(['appointments as revenue' => fn($q) => $q
                ->where('status', 'completed')
                ->when($ranged, fn($q2) => $q2->whereBetween('scheduled_at', [$from, $to]))
            ], 'price_at_booking')
            ->orderByDesc('appointments_count')
            ->limit($limit)
            ->get(['id', 'name', 'price', 'category'])
            ->toArray();
    }

    private function busiestDays($salon, ?Carbon $from, ?Carbon $to): array
    {
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return $salon->appointments()
            ->where('status', 'completed')
            ->when($from && $to, fn($q) => $q->whereBetween('scheduled_at', [$from, $to]))
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

    private function ordersSummary($salon, ?Carbon $from, ?Carbon $to): array
    {
        return $salon->orders()
            ->when($from && $to, fn($q) => $q->whereBetween('created_at', [$from, $to]))
            ->selectRaw('status, count(*) as count, sum(total_amount) as total')
            ->groupBy('status')
            ->get()
            ->keyBy('status')
            ->toArray();
    }

    private function recentAppointments($salon, ?Carbon $from, ?Carbon $to, int $limit = 10): array
    {
        return $salon->appointments()
            ->when($from && $to, fn($q) => $q->whereBetween('scheduled_at', [$from, $to]))
            ->with('client:id,name,phone', 'service:id,name,price')
            ->orderByDesc('scheduled_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }
}
