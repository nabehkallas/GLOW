<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoChannel
{
    public function send(mixed $notifiable, Notification $notification): void
    {
        $token = $notifiable->expo_push_token ?? null;

        if (! $token || ! method_exists($notification, 'toExpoPush')) {
            return;
        }

        $payload = $notification->toExpoPush($notifiable);

        try {
            Http::withHeaders(['Accept-Encoding' => 'gzip, deflate'])
                ->post('https://exp.host/api/v2/push/send', $payload);
        } catch (\Throwable $e) {
            Log::warning('Expo push failed: ' . $e->getMessage());
        }
    }
}
