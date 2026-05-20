<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = $request->user()->salon
            ->orders()
            ->with('items.product')
            ->latest()
            ->paginate(15);

        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'notes'              => 'nullable|string',
        ]);

        $salon = $request->user()->salon;

        abort_if($salon->status !== 'approved', 403, 'Your salon must be approved to place orders.');

        $order = DB::transaction(function () use ($data, $salon) {
            $total = 0;
            $orderItems = [];

            foreach ($data['items'] as $item) {
                $product = Product::where('id', $item['product_id'])
                    ->where('is_active', true)
                    ->firstOrFail();

                abort_if($product->stock < $item['quantity'], 422, "Insufficient stock for product: {$product->name}");

                $product->decrement('stock', $item['quantity']);

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $product->price,
                ];

                $total += $product->price * $item['quantity'];
            }

            $order = $salon->orders()->create([
                'total_amount' => $total,
                'notes'        => $data['notes'] ?? null,
                'status'       => 'pending',
            ]);

            $order->items()->createMany($orderItems);

            return $order;
        });

        return response()->json($order->load('items.product'), 201);
    }

    public function show(Request $request, Order $order)
    {
        abort_unless($order->salon_id === $request->user()->salon->id, 403);

        return response()->json($order->load('items.product'));
    }
}
