<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use Illuminate\Http\Request;

class CashierController extends Controller
{
    public function index(Request $request)
    {
        $rows = CashTransaction::with('salon:id,salon_name')
            ->when($request->salon_id, fn($q) => $q->where('salon_id', $request->salon_id))
            ->when($request->type,     fn($q) => $q->where('type', $request->type))
            ->when($request->date_from, fn($q) => $q->whereDate('date', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('date', '<=', $request->date_to))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(50);

        return response()->json($rows);
    }

    public function summary(Request $request)
    {
        $q = CashTransaction::query()
            ->when($request->salon_id,  fn($q) => $q->where('salon_id', $request->salon_id))
            ->when($request->date_from, fn($q) => $q->whereDate('date', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('date', '<=', $request->date_to));

        $totalIn  = (clone $q)->where('type', 'in')->sum('amount');
        $totalOut = (clone $q)->where('type', 'out')->sum('amount');

        return response()->json([
            'total_in'  => (float) $totalIn,
            'total_out' => (float) $totalOut,
            'net'       => (float) ($totalIn - $totalOut),
        ]);
    }

    public function salonBreakdown(Request $request)
    {
        $rows = CashTransaction::selectRaw('salon_id, type, SUM(amount) as total')
            ->when($request->date_from, fn($q) => $q->whereDate('date', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('date', '<=', $request->date_to))
            ->groupBy('salon_id', 'type')
            ->with('salon:id,salon_name')
            ->get();

        // pivot into per-salon shape
        $salons = [];
        foreach ($rows as $row) {
            $id = $row->salon_id;
            if (!isset($salons[$id])) {
                $salons[$id] = [
                    'salon_id'   => $id,
                    'salon_name' => $row->salon->salon_name ?? '—',
                    'total_in'   => 0,
                    'total_out'  => 0,
                ];
            }
            $salons[$id]['total_' . $row->type] = (float) $row->total;
        }

        $result = array_map(function ($s) {
            $s['net'] = $s['total_in'] - $s['total_out'];
            return $s;
        }, array_values($salons));

        usort($result, fn($a, $b) => $b['total_in'] <=> $a['total_in']);

        return response()->json(['data' => $result]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'salon_id' => 'required|exists:salons,id',
            'type'     => 'required|in:in,out',
            'category' => 'required|string|max:100',
            'amount'   => 'required|numeric|min:0.01',
            'note'     => 'nullable|string|max:500',
            'date'     => 'required|date',
        ]);

        $tx = CashTransaction::create($data);
        $tx->load('salon:id,salon_name');

        return response()->json(['data' => $tx], 201);
    }

    public function destroy(CashTransaction $cashTransaction)
    {
        $cashTransaction->delete();
        return response()->json(['message' => 'deleted']);
    }
}
