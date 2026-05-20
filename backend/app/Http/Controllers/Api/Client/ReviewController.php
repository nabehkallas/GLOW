<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Review;
use App\Models\Salon;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'rating'         => 'required|integer|between:1,5',
            'comment'        => 'nullable|string|max:1000',
        ]);

        $appointment = Appointment::findOrFail($data['appointment_id']);

        abort_unless($appointment->client_id === $request->user()->id, 403);
        abort_unless($appointment->status === 'completed', 422, 'You can only review completed appointments.');

        $review = Review::create([
            'client_id'      => $request->user()->id,
            'salon_id'       => $appointment->salon_id,
            'appointment_id' => $appointment->id,
            'rating'         => $data['rating'],
            'comment'        => $data['comment'] ?? null,
        ]);

        return response()->json($review->load('client:id,name', 'appointment'), 201);
    }

    public function index(Request $request, Salon $salon)
    {
        abort_unless($salon->status === 'approved', 404);

        $reviews = $salon->reviews()
            ->with('client:id,name', 'appointment:id,scheduled_at')
            ->latest()
            ->paginate(15);

        return response()->json([
            'average_rating' => $salon->average_rating,
            'reviews_count'  => $salon->reviews_count,
            'reviews'        => $reviews,
        ]);
    }

    public function myReviews(Request $request)
    {
        $reviews = Review::where('client_id', $request->user()->id)
            ->with('salon:id,name,city', 'appointment:id,scheduled_at')
            ->latest()
            ->paginate(15);

        return response()->json($reviews);
    }

    public function destroy(Request $request, Review $review)
    {
        abort_unless($review->client_id === $request->user()->id, 403);

        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }
}
