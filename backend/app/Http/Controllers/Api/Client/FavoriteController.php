<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalonResource;
use App\Models\ClientFavorite;
use App\Models\Salon;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        $salons = Salon::whereHas('favorites', fn($q) => $q->where('user_id', $request->user()->id))
            ->where('status', 'approved')
            ->with('services')
            ->get();

        return SalonResource::collection($salons);
    }

    public function toggle(Request $request, Salon $salon)
    {
        abort_unless($salon->status === 'approved', 404);

        $userId    = $request->user()->id;
        $existing  = ClientFavorite::where('user_id', $userId)->where('salon_id', $salon->id)->first();

        if ($existing) {
            $existing->delete();
            $favorited = false;
        } else {
            ClientFavorite::create(['user_id' => $userId, 'salon_id' => $salon->id]);
            $favorited = true;
        }

        return response()->json(['favorited' => $favorited]);
    }

    public function ids(Request $request)
    {
        $ids = ClientFavorite::where('user_id', $request->user()->id)->pluck('salon_id');

        return response()->json(['data' => $ids]);
    }
}
