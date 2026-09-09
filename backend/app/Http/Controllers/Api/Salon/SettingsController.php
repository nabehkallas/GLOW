<?php

namespace App\Http\Controllers\Api\Salon;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalonResource;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function update(Request $request)
    {
        $data = $request->validate([
            'balance_management_enabled' => 'sometimes|boolean',
        ]);

        $salon = $request->user()->salon;
        $salon->update($data);

        return new SalonResource($salon);
    }
}
