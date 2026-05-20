<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Order;
use App\Models\Salon;
use App\Models\User;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'total_clients'      => User::where('role', 'client')->count(),
            'total_salons'       => Salon::count(),
            'pending_salons'     => Salon::where('status', 'pending')->count(),
            'total_orders'       => Order::count(),
            'total_appointments' => Appointment::count(),
        ]);
    }
}
