<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientOrderResource;
use App\Models\CashTransaction;
use App\Models\ClientOrder;
use App\Notifications\ClientOrderStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ClientOrderController extends Controller
{
    private const TRANSITIONS = [
        'pending'   => 'confirmed',
        'confirmed' => 'shipped',
        'shipped'   => 'delivered',
    ];

    public function index(Request $request)
    {
        $orders = ClientOrder::with('client', 'items.product', 'items.variant.attributeValues.attribute')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15);

        return ClientOrderResource::collection($orders);
    }

    public function show(ClientOrder $order)
    {
        return new ClientOrderResource($order->load('client', 'items.product', 'items.variant.attributeValues.attribute'));
    }

    public function advance(ClientOrder $order)
    {
        $next = self::TRANSITIONS[$order->status] ?? null;

        abort_if($next === null, 422, "Order is already {$order->status} and cannot be advanced.");

        $order->update(['status' => $next] + ($next === 'delivered' ? ['delivered_at' => now()] : []));

        if ($next === 'delivered') {
            CashTransaction::create([
                'salon_id'        => null,
                'client_order_id' => $order->id,
                'type'            => 'in',
                'category'        => 'product_sale',
                'amount'          => $order->total_amount,
                'note'            => 'طلب المتجر #' . $order->id,
                'date'            => Carbon::today()->toDateString(),
            ]);
        }

        $order->load('client', 'items.product', 'items.variant.attributeValues.attribute');
        $order->client->notify(new ClientOrderStatusChanged($order, $next));

        return new ClientOrderResource($order);
    }

    public function fail(ClientOrder $order)
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

        $order->load('client', 'items.product', 'items.variant.attributeValues.attribute');
        $order->client->notify(new ClientOrderStatusChanged($order, 'failed'));

        return new ClientOrderResource($order);
    }

    public function returnOrder(ClientOrder $order)
    {
        abort_unless($order->status === 'delivered', 422, 'Only delivered orders can be marked as returned.');

        $this->performReturn($order);

        return new ClientOrderResource($order);
    }

    public function approveReturn(ClientOrder $order)
    {
        abort_unless($order->status === 'return_requested', 422, 'No pending return request for this order.');

        $this->performReturn($order);

        return new ClientOrderResource($order);
    }

    public function denyReturn(ClientOrder $order)
    {
        abort_unless($order->status === 'return_requested', 422, 'No pending return request for this order.');

        $order->update(['status' => 'delivered', 'return_reason' => null]);
        $order->load('client', 'items.product', 'items.variant.attributeValues.attribute');
        $order->client->notify(new ClientOrderStatusChanged($order, 'return_denied'));

        return new ClientOrderResource($order);
    }

    private function performReturn(ClientOrder $order): void
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
                'salon_id'        => null,
                'client_order_id' => $order->id,
                'type'            => 'out',
                'category'        => 'return',
                'amount'          => $order->total_amount,
                'note'            => 'إرجاع طلب المتجر #' . $order->id,
                'date'            => Carbon::today()->toDateString(),
            ]);
        });

        $order->load('client', 'items.product', 'items.variant.attributeValues.attribute');
        $order->client->notify(new ClientOrderStatusChanged($order, 'returned'));
    }

    public function approveCancellation(ClientOrder $order)
    {
        abort_unless($order->status === 'cancellation_requested', 422, 'No pending cancellation request for this order.');

        $this->performCancel($order);

        return new ClientOrderResource($order);
    }

    public function denyCancellation(ClientOrder $order)
    {
        abort_unless($order->status === 'cancellation_requested', 422, 'No pending cancellation request for this order.');

        $order->update([
            'status'              => $order->cancel_from_status ?? 'confirmed',
            'cancellation_reason' => null,
            'cancel_from_status'  => null,
        ]);
        $order->load('client', 'items.product', 'items.variant.attributeValues.attribute');
        $order->client->notify(new ClientOrderStatusChanged($order, 'cancellation_denied'));

        return new ClientOrderResource($order);
    }

    private function performCancel(ClientOrder $order): void
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

        $order->load('client', 'items.product', 'items.variant.attributeValues.attribute');
        $order->client->notify(new ClientOrderStatusChanged($order, 'cancelled'));
    }

    public function update(Request $request, ClientOrder $order)
    {
        abort_unless($order->status === 'delivered', 422, 'Only delivered orders can be edited.');

        $data = $request->validate([
            'total_amount' => 'required|numeric|min:0',
            'notes'        => 'nullable|string|max:500',
        ]);

        $order->update($data);

        CashTransaction::where('client_order_id', $order->id)
            ->where('category', 'product_sale')
            ->update(['amount' => $data['total_amount']]);

        return new ClientOrderResource($order->load('client', 'items.product', 'items.variant.attributeValues.attribute'));
    }
}
