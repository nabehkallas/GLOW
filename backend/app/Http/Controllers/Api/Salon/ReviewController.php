<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $salon = $request->user()->salon;

        $reviews = $salon->reviews()
            ->with('client:id,name', 'appointment:id,scheduled_at')
            ->when($request->rating, fn($q) => $q->where('rating', $request->rating))
            ->latest()
            ->paginate(15);

        return response()->json([
            'average_rating' => $salon->average_rating,
            'reviews_count'  => $salon->reviews_count,
            'reviews'        => $reviews,
        ]);
    }
}
