<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CashierController extends Controller
{
    public function index(Request $request)
    {
        $salon = $request->user()->salon;

        $rows = CashTransaction::where('salon_id', $salon->id)
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->date_from, fn($q) => $q->whereDate('date', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('date', '<=', $request->date_to))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function summary(Request $request)
    {
        $salon = $request->user()->salon;
        $date  = $request->date ?? Carbon::today()->toDateString();

        $q      = CashTransaction::where('salon_id', $salon->id)->whereDate('date', $date);
        $totalIn  = (clone $q)->where('type', 'in')->sum('amount');
        $totalOut = (clone $q)->where('type', 'out')->sum('amount');

        return response()->json([
            'date'      => $date,
            'total_in'  => (float) $totalIn,
            'total_out' => (float) $totalOut,
            'net'       => (float) ($totalIn - $totalOut),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type'     => 'required|in:in,out',
            'category' => 'required|string|max:100',
            'amount'   => 'required|numeric|min:0.01',
            'note'     => 'nullable|string|max:500',
            'date'     => 'required|date',
        ]);

        $salon = $request->user()->salon;
        $tx    = CashTransaction::create(['salon_id' => $salon->id, ...$data]);

        return response()->json(['data' => $tx], 201);
    }

    public function destroy(Request $request, CashTransaction $cashTransaction)
    {
        if ($cashTransaction->salon_id !== $request->user()->salon->id) {
            abort(403);
        }

        $cashTransaction->delete();

        return response()->json(['message' => 'deleted']);
    }
}
