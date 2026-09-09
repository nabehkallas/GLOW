<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalonResource;
use App\Models\OrderItem;
use App\Models\Salon;
use App\Notifications\SalonApproved;
use App\Notifications\SalonRejected;
use App\Services\SalonAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SalonController extends Controller
{
    public function index(Request $request)
    {
        $salons = Salon::with('user')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate(15);

        return SalonResource::collection($salons);
    }

    public function show(Salon $salon)
    {
        return new SalonResource($salon->load('user', 'services', 'workingHours'));
    }

    public function stats(Request $request, Salon $salon, SalonAnalyticsService $analytics)
    {
        $months = max(1, min((int) $request->get('months', 6), 24));

        return response()->json([
            ...$analytics->compute($salon, $months),
            'ordered_products' => $this->orderedProducts($salon),
        ]);
    }

    private function orderedProducts(Salon $salon)
    {
        return OrderItem::selectRaw('product_id, sum(quantity) as quantity')
            ->whereHas('order', fn($q) => $q->where('salon_id', $salon->id)->where('status', 'delivered'))
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
    }

    public function updatePhone(Request $request, Salon $salon)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:/^(\+963|0)9[1-9]\d{7}$/'],
        ]);

        $salon->user->update(['phone' => $data['phone']]);

        return new SalonResource($salon->load('user', 'services', 'workingHours'));
    }

    public function approve(Salon $salon)
    {
        $salon->update(['status' => 'approved', 'rejection_reason' => null]);
        $salon->user->notify(new SalonApproved($salon));

        return response()->json(['message' => 'Salon approved.', 'salon' => new SalonResource($salon)]);
    }

    public function reject(Request $request, Salon $salon)
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        $salon->update(['status' => 'rejected', 'rejection_reason' => $request->reason]);
        $salon->user->notify(new SalonRejected($salon, $request->reason));

        return response()->json(['message' => 'Salon rejected.', 'salon' => new SalonResource($salon)]);
    }

    public function destroy(Salon $salon)
    {
        $salon->delete();

        return response()->json(['message' => 'Salon removed.']);
    }
}
