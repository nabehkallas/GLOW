<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'phone'    => 'sometimes|nullable|string|max:20',
            'password' => ['sometimes', Password::min(8)],
        ]);

        $request->user()->update($data);

        return new UserResource($request->user());
    }
}
