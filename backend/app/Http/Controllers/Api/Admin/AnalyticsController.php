<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Salon;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $months = max(1, min((int) $request->get('months', 6), 24));

        return response()->json([
            'overview'               => $this->overview(),
            'monthly_orders'         => $this->monthlyOrders($months),
            'monthly_appointments'   => $this->monthlyAppointments($months),
            'monthly_registrations'  => $this->monthlyRegistrations($months),
            'top_salons'             => $this->topSalons(),
            'top_products'           => $this->topProducts(),
            'orders_by_status'       => $this->ordersByStatus(),
            'appointments_by_status' => $this->appointmentsByStatus(),
        ]);
    }

    private function overview(): array
    {
        return [
            'total_clients'              => User::where('role', 'client')->count(),
            'total_salons'               => Salon::count(),
            'pending_salons'             => Salon::where('status', 'pending')->count(),
            'approved_salons'            => Salon::where('status', 'approved')->count(),
            'rejected_salons'            => Salon::where('status', 'rejected')->count(),
            'total_products'             => Product::count(),
            'total_orders'               => Order::count(),
            'total_appointments'         => Appointment::count(),
            'total_order_revenue'        => (float) Order::where('status', 'delivered')->sum('total_amount'),
            'total_appointment_revenue'  => (float) Appointment::where('status', 'completed')->sum('price_at_booking'),
        ];
    }

    private function monthlyOrders(int $months): array
    {
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();

        return Order::where('created_at', '>=', $start)
            ->get()
            ->groupBy(fn($o) => Carbon::parse($o->created_at)->format('Y-m'))
            ->map(fn($group, $month) => [
                'month'   => $month,
                'count'   => $group->count(),
                'revenue' => round($group->where('status', 'delivered')->sum('total_amount'), 2),
            ])
            ->values()
            ->toArray();
    }

    private function monthlyAppointments(int $months): array
    {
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();

        return Appointment::where('created_at', '>=', $start)
            ->get()
            ->groupBy(fn($a) => Carbon::parse($a->created_at)->format('Y-m'))
            ->map(fn($group, $month) => [
                'month'   => $month,
                'count'   => $group->count(),
                'revenue' => round($group->where('status', 'completed')->sum('price_at_booking'), 2),
            ])
            ->values()
            ->toArray();
    }

    private function monthlyRegistrations(int $months): array
    {
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();

        return User::where('created_at', '>=', $start)
            ->get()
            ->groupBy(fn($u) => Carbon::parse($u->created_at)->format('Y-m'))
            ->map(fn($group, $month) => [
                'month'   => $month,
                'clients' => $group->where('role', 'client')->count(),
                'salons'  => $group->where('role', 'salon')->count(),
            ])
            ->values()
            ->toArray();
    }

    private function topSalons(int $limit = 5): array
    {
        return Salon::withCount('appointments')
            ->withSum(['appointments as revenue' => fn($q) => $q->where('status', 'completed')], 'price_at_booking')
            ->orderByDesc('appointments_count')
            ->limit($limit)
            ->get(['id', 'name', 'city'])
            ->toArray();
    }

    private function topProducts(int $limit = 5): array
    {
        return Product::withSum('orderItems as total_ordered', 'quantity')
            ->withSum(['orderItems as revenue' => fn($q) => $q->whereHas(
                'order', fn($o) => $o->where('status', 'delivered')
            )], DB::raw('quantity * unit_price'))
            ->orderByDesc('total_ordered')
            ->limit($limit)
            ->get(['id', 'name', 'category', 'price'])
            ->toArray();
    }

    private function ordersByStatus(): array
    {
        return Order::selectRaw('status, count(*) as count, sum(total_amount) as total')
            ->groupBy('status')
            ->get()
            ->keyBy('status')
            ->toArray();
    }

    private function appointmentsByStatus(): array
    {
        return Appointment::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get()
            ->keyBy('status')
            ->toArray();
    }
}
