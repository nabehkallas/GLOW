<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show()
    {
        return response()->json([
            'return_window_days' => (int) Setting::get('return_window_days', 14),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'return_window_days' => 'sometimes|integer|min:1|max:365',
        ]);

        if (isset($data['return_window_days'])) {
            Setting::set('return_window_days', $data['return_window_days']);
        }

        return response()->json([
            'return_window_days' => (int) Setting::get('return_window_days', 14),
        ]);
    }
}
