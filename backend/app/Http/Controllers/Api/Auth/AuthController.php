<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Salon;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function registerClient(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => ['required', Password::min(8)],
            'phone'    => ['required', 'string', 'regex:/^(\+963|0)9[1-9]\d{7}$/'],
        ]);

        $user = User::create([...$data, 'role' => 'client']);

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $user->createToken('api')->plainTextToken,
        ], 201);
    }

    public function registerSalon(Request $request)
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users',
            'password'       => ['required', Password::min(8)],
            'phone'          => ['required', 'string', 'regex:/^(\+963|0)9[1-9]\d{7}$/'],
            'salon_name'     => 'required|string|max:255',
            'address'        => 'required|string',
            'city'           => 'required|string|max:100',
            'license_number' => 'nullable|string|max:100',
            'description'    => 'nullable|string',
            'latitude'       => 'nullable|numeric|between:-90,90',
            'longitude'      => 'nullable|numeric|between:-180,180',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'phone'    => $data['phone'] ?? null,
            'role'     => 'salon',
        ]);

        Salon::create([
            'user_id'        => $user->id,
            'name'           => $data['salon_name'],
            'address'        => $data['address'],
            'city'           => $data['city'],
            'latitude'       => $data['latitude'] ?? null,
            'longitude'      => $data['longitude'] ?? null,
            'license_number' => $data['license_number'] ?? null,
            'description'    => $data['description'] ?? null,
            'status'         => 'pending',
        ]);

        return response()->json([
            'message' => 'Registration submitted. Awaiting admin approval.',
            'user'    => new UserResource($user->load('salon')),
            'token'   => $user->createToken('api')->plainTextToken,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $user->tokens()->delete();

        return response()->json([
            'user'  => new UserResource($user->load('salon')),
            'token' => $user->createToken('api')->plainTextToken,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        return new UserResource($request->user()->load('salon'));
    }

    public function updatePushToken(Request $request)
    {
        $request->validate(['token' => 'required|string|max:255']);
        $request->user()->update(['expo_push_token' => $request->token]);
        return response()->json(['message' => 'Push token updated.']);
    }
}
