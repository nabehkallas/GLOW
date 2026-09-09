<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SearchLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SearchHistoryController extends Controller
{
    // Aggregated term + count per context — never joins back to the user who
    // searched, by design (admin monitors search trends, not individuals).
    public function trending(Request $request)
    {
        $days = min(max((int) $request->get('days', 30), 1), 365);

        $rows = SearchLog::where('created_at', '>=', now()->subDays($days))
            ->select('context', 'term', DB::raw('count(*) as count'))
            ->groupBy('context', 'term')
            ->orderByDesc('count')
            ->limit(50)
            ->get();

        return response()->json(['data' => $rows]);
    }
}
