<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\CashTransaction;
use App\Models\Order;
use App\Notifications\OrderStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class OrderController extends Controller
{
    private const TRANSITIONS = [
        'pending'   => 'confirmed',
        'confirmed' => 'shipped',
        'shipped'   => 'delivered',
    ];

    public function index(Request $request)
    {
        $orders = Order::with('salon.user', 'items.product')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15);

        return OrderResource::collection($orders);
    }

    public function show(Order $order)
    {
        return new OrderResource($order->load('salon.user', 'items.product'));
    }

    public function advance(Order $order)
    {
        $next = self::TRANSITIONS[$order->status] ?? null;

        abort_if($next === null, 422, "Order is already {$order->status} and cannot be advanced.");

        $order->update(['status' => $next]);

        if ($next === 'delivered') {
            CashTransaction::create([
                'salon_id' => $order->salon_id,
                'type'     => 'in',
                'category' => 'product_sale',
                'amount'   => $order->total_amount,
                'note'     => 'طلب #' . $order->id,
                'date'     => Carbon::today()->toDateString(),
            ]);
        }

        $order->load('salon.user', 'items.product');
        $order->salon->user->notify(new OrderStatusChanged($order, $next));

        return new OrderResource($order);
    }
}
