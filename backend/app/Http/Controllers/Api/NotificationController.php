<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(20);

        return response()->json($notifications);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Marked as read.']);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function webPushSubscribe(Request $request)
    {
        $data = $request->validate([
            'endpoint'        => 'required|string',
            'keys.p256dh'     => 'required|string',
            'keys.auth'       => 'required|string',
            'contentEncoding' => 'nullable|string',
        ]);

        $request->user()->updatePushSubscription(
            $data['endpoint'],
            $data['keys']['p256dh'],
            $data['keys']['auth'],
            $data['contentEncoding'] ?? null,
        );

        return response()->json(['message' => 'Subscribed.']);
    }

    public function webPushUnsubscribe(Request $request)
    {
        $request->validate(['endpoint' => 'required|string']);

        $request->user()->deletePushSubscription($request->endpoint);

        return response()->json(['message' => 'Unsubscribed.']);
    }
}
