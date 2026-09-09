<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalonTransactionResource;
use App\Models\SalonTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class BalanceController extends Controller
{
    const IN_CATEGORIES  = ['product_sale', 'other'];
    const OUT_CATEGORIES = ['salaries', 'maintenance', 'supplies', 'other'];

    public function summary(Request $request)
    {
        $salon = $request->user()->salon;

        $appointmentIncome = $salon->appointments()
            ->where('status', 'completed')
            ->when($request->date_from, fn($q) => $q->whereDate('scheduled_at', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('scheduled_at', '<=', $request->date_to))
            ->sum('price_at_booking');

        $transactions = $salon->transactions()
            ->when($request->date_from, fn($q) => $q->whereDate('date', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('date', '<=', $request->date_to));

        $manualIncome = (clone $transactions)->where('type', 'in')->sum('amount');
        $totalExpenses = (clone $transactions)->where('type', 'out')->sum('amount');
        $totalIncome = $appointmentIncome + $manualIncome;

        return response()->json([
            'appointment_income' => (float) $appointmentIncome,
            'manual_income'      => (float) $manualIncome,
            'total_income'       => (float) $totalIncome,
            'total_expenses'     => (float) $totalExpenses,
            'net_balance'        => (float) ($totalIncome - $totalExpenses),
        ]);
    }

    public function history(Request $request)
    {
        $salon = $request->user()->salon;
        $months = max(1, min((int) $request->get('months', 6), 24));
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();

        $appointmentIncome = $salon->appointments()
            ->where('status', 'completed')
            ->where('scheduled_at', '>=', $start)
            ->get(['scheduled_at', 'price_at_booking'])
            ->groupBy(fn($a) => Carbon::parse($a->scheduled_at)->format('Y-m'))
            ->map(fn($g) => $g->sum('price_at_booking'));

        $manualByMonth = $salon->transactions()
            ->where('date', '>=', $start)
            ->get(['date', 'type', 'amount'])
            ->groupBy(fn($t) => Carbon::parse($t->date)->format('Y-m'));

        $monthsList = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $monthsList[] = Carbon::now()->subMonths($i)->format('Y-m');
        }

        return response()->json(collect($monthsList)->map(function ($m) use ($appointmentIncome, $manualByMonth) {
            $rows = $manualByMonth[$m] ?? collect();
            $income = round(($appointmentIncome[$m] ?? 0) + $rows->where('type', 'in')->sum('amount'), 2);
            $expenses = round($rows->where('type', 'out')->sum('amount'), 2);

            return [
                'month'    => $m,
                'income'   => $income,
                'expenses' => $expenses,
                'net'      => round($income - $expenses, 2),
            ];
        })->toArray());
    }

    public function index(Request $request)
    {
        $rows = $request->user()->salon
            ->transactions()
            ->when($request->type,      fn($q) => $q->where('type', $request->type))
            ->when($request->category,  fn($q) => $q->where('category', $request->category))
            ->when($request->date_from, fn($q) => $q->whereDate('date', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('date', '<=', $request->date_to))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(50);

        return SalonTransactionResource::collection($rows);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type'     => 'required|in:in,out',
            'category' => ['required', 'string', function ($attribute, $value, $fail) use ($request) {
                $allowed = $request->type === 'in' ? self::IN_CATEGORIES : self::OUT_CATEGORIES;
                if (! in_array($value, $allowed, true)) {
                    $fail('The selected category is invalid for this transaction type.');
                }
            }],
            'amount'   => 'required|numeric|min:0.01',
            'comment'  => 'nullable|string|max:500',
            'date'     => 'required|date',
        ]);

        $transaction = $request->user()->salon->transactions()->create($data);

        return new SalonTransactionResource($transaction);
    }

    public function destroy(Request $request, SalonTransaction $transaction)
    {
        abort_unless($transaction->salon_id === $request->user()->salon->id, 403);

        $transaction->delete();

        return response()->json(['message' => 'Transaction removed.']);
    }
}
