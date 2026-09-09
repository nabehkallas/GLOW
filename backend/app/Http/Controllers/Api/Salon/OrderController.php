<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\NewOrderPlaced;
use App\Notifications\OrderCancellationRequested;
use App\Notifications\OrderReturnRequested;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date',
        ]);

        $orders = $request->user()->salon
            ->orders()
            ->with('items.product', 'items.variant.attributeValues.attribute')
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->latest()
            ->get();

        return OrderResource::collection($orders);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'items'                       => 'required|array|min:1',
            'items.*.product_id'         => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity'           => 'required|integer|min:1',
            'notes'                      => 'nullable|string',
        ]);

        $salon = $request->user()->salon;

        abort_if($salon->status !== 'approved', 403, 'Your salon must be approved to place orders.');

        $order = DB::transaction(function () use ($data, $salon) {
            $total      = 0;
            $orderItems = [];

            foreach ($data['items'] as $item) {
                $product = Product::where('id', $item['product_id'])
                    ->where('is_active', true)
                    ->firstOrFail();

                $hasVariants = $product->variants()->where('is_active', true)->exists();

                abort_if($hasVariants && empty($item['product_variant_id']), 422, "Please select options for: {$product->name}");

                $variant = null;

                if (!empty($item['product_variant_id'])) {
                    $variant = ProductVariant::where('id', $item['product_variant_id'])
                        ->where('product_id', $product->id)
                        ->where('is_active', true)
                        ->lockForUpdate()
                        ->firstOrFail();

                    abort_if($variant->stock < $item['quantity'], 422, "Insufficient stock for product: {$product->name}");

                    $variant->decrement('stock', $item['quantity']);
                    $variant->setRelation('product', $product);

                    $unitPrice = $variant->priceForQuantity($item['quantity']);
                } else {
                    abort_if($product->stock < $item['quantity'], 422, "Insufficient stock for product: {$product->name}");

                    $product->decrement('stock', $item['quantity']);

                    $unitPrice = $product->priceForQuantity($item['quantity']);
                }

                $orderItems[] = [
                    'product_id'         => $product->id,
                    'product_variant_id' => $variant?->id,
                    'quantity'           => $item['quantity'],
                    'unit_price'         => $unitPrice,
                ];

                $total += $unitPrice * $item['quantity'];
            }

            $order = $salon->orders()->create([
                'total_amount' => $total,
                'notes'        => $data['notes'] ?? null,
                'status'       => 'pending',
            ]);

            $order->items()->createMany($orderItems);

            return $order;
        });

        Notification::send(User::where('role', 'admin')->get(), new NewOrderPlaced($order, 'b2b'));

        return new OrderResource($order->load('items.product', 'items.variant.attributeValues.attribute'));
    }

    public function show(Request $request, Order $order)
    {
        abort_unless($order->salon_id === $request->user()->salon->id, 403);

        return new OrderResource($order->load('items.product', 'items.variant.attributeValues.attribute'));
    }

    public function cancel(Request $request, Order $order)
    {
        abort_unless($order->salon_id === $request->user()->salon->id, 403);

        if ($order->status === 'pending') {
            DB::transaction(function () use ($order) {
                foreach ($order->items as $item) {
                    if ($item->product_variant_id) {
                        $item->variant()->increment('stock', $item->quantity);
                    } else {
                        $item->product()->increment('stock', $item->quantity);
                    }
                }
                $order->update(['status' => 'cancelled']);
            });

            return new OrderResource($order->load('items.product', 'items.variant.attributeValues.attribute'));
        }

        abort_unless(in_array($order->status, ['confirmed', 'shipped']), 422, 'This order cannot be cancelled.');

        $data = $request->validate(['reason' => 'nullable|string|max:500']);
        $fromStatus = $order->status;

        $order->update([
            'status'               => 'cancellation_requested',
            'cancellation_reason'  => $data['reason'] ?? null,
            'cancel_from_status'   => $fromStatus,
        ]);
        $order->load('items.product', 'items.variant.attributeValues.attribute');

        Notification::send(User::where('role', 'admin')->get(), new OrderCancellationRequested($order, 'b2b'));

        return new OrderResource($order);
    }

    public function requestReturn(Request $request, Order $order)
    {
        abort_unless($order->salon_id === $request->user()->salon->id, 403);
        abort_unless($order->status === 'delivered', 422, 'Only delivered orders can be returned.');

        $windowDays = (int) Setting::get('return_window_days', 14);
        abort_if(
            !$order->delivered_at || $order->delivered_at->diffInDays(now()) > $windowDays,
            422,
            'The return window for this order has passed.'
        );

        $data = $request->validate(['reason' => 'nullable|string|max:500']);

        $order->update(['status' => 'return_requested', 'return_reason' => $data['reason'] ?? null]);
        $order->load('items.product', 'items.variant.attributeValues.attribute');

        Notification::send(User::where('role', 'admin')->get(), new OrderReturnRequested($order, 'b2b'));

        return new OrderResource($order);
    }

    public function productsOrdered(Request $request)
    {
        $salon = $request->user()->salon;

        $rows = OrderItem::selectRaw('product_id, sum(quantity) as quantity')
            ->whereHas('order', fn($q) => $q->where('salon_id', $salon->id)->whereNotIn('status', ['cancelled', 'failed']))
            ->groupBy('product_id')
            ->with('product:id,name,image')
            ->orderByDesc('quantity')
            ->get()
            ->filter(fn($row) => $row->product !== null)
            ->map(fn($row) => [
                'product_id' => $row->product_id,
                'name'       => $row->product->name,
                'image_url'  => $row->product->image ? Storage::disk('public')->url($row->product->image) : null,
                'quantity'   => (int) $row->quantity,
            ])
            ->values();

        return response()->json(['products' => $rows]);
    }
}
