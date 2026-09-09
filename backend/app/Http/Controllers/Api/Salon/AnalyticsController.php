<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Services\SalonAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request, SalonAnalyticsService $analytics)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date|after_or_equal:date_from',
        ]);

        $salon  = $request->user()->salon;
        $months = max(1, min((int) $request->get('months', 6), 24));
        $from   = $request->date_from ? Carbon::parse($request->date_from)->startOfDay() : null;
        $to     = $request->date_to ? Carbon::parse($request->date_to)->endOfDay() : null;

        return response()->json($analytics->compute($salon, $months, $from, $to));
    }
}
