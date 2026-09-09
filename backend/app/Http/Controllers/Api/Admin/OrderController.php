<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientOrderResource;
use App\Http\Resources\OrderResource;
use App\Models\CashTransaction;
use App\Models\ClientOrder;
use App\Models\Order;
use App\Notifications\OrderStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private const TRANSITIONS = [
        'pending'   => 'confirmed',
        'confirmed' => 'shipped',
        'shipped'   => 'delivered',
    ];

    public function index(Request $request)
    {
        $orders = Order::with('salon.user', 'items.product', 'items.variant.attributeValues.attribute')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15);

        return OrderResource::collection($orders);
    }

    public function show(Order $order)
    {
        return new OrderResource($order->load('salon.user', 'items.product', 'items.variant.attributeValues.attribute'));
    }

    /**
     * Merged recent-orders feed for the dashboard: B2B restock orders (salons buying
     * from Prima) and B2C shop orders (clients buying from Prima) are separate tables
     * with no shared endpoint, so this fetches the latest N of each, tags them with a
     * `type`, and merges+sorts in PHP rather than a real cross-table query.
     */
    public function recent(Request $request)
    {
        $limit = max(1, min((int) $request->get('limit', 10), 50));

        $b2b = Order::with('salon.user', 'items.product', 'items.variant.attributeValues.attribute')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($o) => array_merge((new OrderResource($o))->toArray($request), ['type' => 'b2b']));

        $b2c = ClientOrder::with('client', 'items.product', 'items.variant.attributeValues.attribute')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($o) => array_merge((new ClientOrderResource($o))->toArray($request), ['type' => 'b2c']));

        $merged = $b2b->concat($b2c)
            ->sortByDesc('created_at')
            ->values()
            ->take($limit);

        return response()->json(['data' => $merged]);
    }

    public function advance(Order $order)
    {
        $next = self::TRANSITIONS[$order->status] ?? null;

        abort_if($next === null, 422, "Order is already {$order->status} and cannot be advanced.");

        $order->update(['status' => $next] + ($next === 'delivered' ? ['delivered_at' => now()] : []));

        if ($next === 'delivered') {
            CashTransaction::create([
                'salon_id' => $order->salon_id,
                'order_id' => $order->id,
                'type'     => 'in',
                'category' => 'product_sale',
                'amount'   => $order->total_amount,
                'note'     => 'طلب #' . $order->id,
                'date'     => Carbon::today()->toDateString(),
            ]);
        }

        $order->load('salon.user', 'items.product', 'items.variant.attributeValues.attribute');
        $order->salon->user->notify(new OrderStatusChanged($order, $next));

        return new OrderResource($order);
    }

    public function cancel(Order $order)
    {
        abort_unless($order->status === 'pending', 422, 'Only pending orders can be cancelled.');

        $this->performCancel($order);

        return new OrderResource($order);
    }

    public function approveCancellation(Order $order)
    {
        abort_unless($order->status === 'cancellation_requested', 422, 'No pending cancellation request for this order.');

        $this->performCancel($order);

        return new OrderResource($order);
    }

    public function denyCancellation(Order $order)
    {
        abort_unless($order->status === 'cancellation_requested', 422, 'No pending cancellation request for this order.');

        $order->update([
            'status'              => $order->cancel_from_status ?? 'confirmed',
            'cancellation_reason' => null,
            'cancel_from_status'  => null,
        ]);
        $order->load('salon.user', 'items.product', 'items.variant.attributeValues.attribute');
        $order->salon->user->notify(new OrderStatusChanged($order, 'cancellation_denied'));

        return new OrderResource($order);
    }

    private function performCancel(Order $order): void
    {
        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if ($item->product_variant_id) {
                    $item->variant()->increment('stock', $item->quantity);
                } else {
                    $item->product()->increment('stock', $item->quantity);
                }
            }
            $order->update(['status' => 'cancelled', 'cancellation_reason' => null, 'cancel_from_status' => null]);
        });

        $order->load('salon.user', 'items.product', 'items.variant.attributeValues.attribute');
        $order->salon->user->notify(new OrderStatusChanged($order, 'cancelled'));
    }

    public function fail(Order $order)
    {
        abort_unless($order->status === 'shipped', 422, 'Only shipped orders can be marked as failed.');

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if ($item->product_variant_id) {
                    $item->variant()->increment('stock', $item->quantity);
                } else {
                    $item->product()->increment('stock', $item->quantity);
                }
            }
            $order->update(['status' => 'failed']);
        });

        $order->load('salon.user', 'items.product', 'items.variant.attributeValues.attribute');
        $order->salon->user->notify(new OrderStatusChanged($order, 'failed'));

        return new OrderResource($order);
    }

    public function returnOrder(Order $order)
    {
        abort_unless($order->status === 'delivered', 422, 'Only delivered orders can be marked as returned.');

        $this->performReturn($order);

        return new OrderResource($order);
    }

    public function approveReturn(Order $order)
    {
        abort_unless($order->status === 'return_requested', 422, 'No pending return request for this order.');

        $this->performReturn($order);

        return new OrderResource($order);
    }

    public function denyReturn(Order $order)
    {
        abort_unless($order->status === 'return_requested', 422, 'No pending return request for this order.');

        $order->update(['status' => 'delivered', 'return_reason' => null]);
        $order->load('salon.user', 'items.product', 'items.variant.attributeValues.attribute');
        $order->salon->user->notify(new OrderStatusChanged($order, 'return_denied'));

        return new OrderResource($order);
    }

    private function performReturn(Order $order): void
    {
        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if ($item->product_variant_id) {
                    $item->variant()->increment('stock', $item->quantity);
                } else {
                    $item->product()->increment('stock', $item->quantity);
                }
            }
            $order->update(['status' => 'returned']);

            CashTransaction::create([
                'salon_id' => $order->salon_id,
                'order_id' => $order->id,
                'type'     => 'out',
                'category' => 'return',
                'amount'   => $order->total_amount,
                'note'     => 'إرجاع طلب #' . $order->id,
                'date'     => Carbon::today()->toDateString(),
            ]);
        });

        $order->load('salon.user', 'items.product', 'items.variant.attributeValues.attribute');
        $order->salon->user->notify(new OrderStatusChanged($order, 'returned'));
    }

    public function update(Request $request, Order $order)
    {
        abort_unless($order->status === 'delivered', 422, 'Only delivered orders can be edited.');

        $data = $request->validate([
            'total_amount' => 'required|numeric|min:0',
            'notes'        => 'nullable|string|max:500',
        ]);

        $order->update($data);

        CashTransaction::where('order_id', $order->id)
            ->where('category', 'product_sale')
            ->update(['amount' => $data['total_amount']]);

        return new OrderResource($order->load('salon.user', 'items.product', 'items.variant.attributeValues.attribute'));
    }
}
