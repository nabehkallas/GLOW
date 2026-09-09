<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdminUserController extends Controller
{
    const PERMISSIONS = ['salons', 'products', 'orders', 'client_orders', 'analytics', 'cashier', 'appointments'];

    public function index()
    {
        $admins = User::where('role', 'admin')->orderBy('name')->get();

        return UserResource::collection($admins);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users',
            'password'      => ['required', Password::min(8)],
            'permissions'   => 'array',
            'permissions.*' => [Rule::in(self::PERMISSIONS)],
        ]);

        $admin = User::create([
            'name'           => $data['name'],
            'email'          => $data['email'],
            'password'       => $data['password'],
            'role'           => 'admin',
            'is_super_admin' => false,
            'permissions'    => $data['permissions'] ?? [],
        ]);

        return new UserResource($admin);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($user->role === 'admin', 404);
        abort_if($user->is_super_admin, 422, 'The Super Admin cannot be edited here.');

        $data = $request->validate([
            'name'          => 'sometimes|required|string|max:255',
            'password'      => ['sometimes', Password::min(8)],
            'permissions'   => 'sometimes|array',
            'permissions.*' => [Rule::in(self::PERMISSIONS)],
        ]);

        $user->update($data);

        return new UserResource($user);
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless($user->role === 'admin', 404);
        abort_if($user->is_super_admin, 422, 'The Super Admin cannot be removed.');
        abort_if($user->id === $request->user()->id, 422, 'You cannot remove your own account.');

        $user->delete();

        return response()->json(['message' => 'Admin removed.']);
    }
}
