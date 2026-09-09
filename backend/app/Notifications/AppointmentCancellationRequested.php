<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\ExpoChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AppointmentCancellationRequested extends Notification
{
    use Queueable;

    public function __construct(public Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['database', ExpoChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        $scheduledAt = $this->appointment->scheduled_at->format('D, M j \a\t g:i A');
        $service = $this->appointment->service?->name ?? 'A service';
        $locale = $notifiable->locale ?? 'ar';

        $body = trans('notifications.appointment_cancellation_requested.body', ['service' => $service, 'time' => $scheduledAt], $locale);

        return [
            'type'           => 'appointment_cancellation_requested',
            'appointment_id' => $this->appointment->id,
            'client_name'    => $this->appointment->client?->name ?? 'A client',
            'service_name'   => $service,
            'scheduled_at'   => $this->appointment->scheduled_at->toDateTimeString(),
            'title'          => trans('notifications.appointment_cancellation_requested.title', [], $locale),
            'body'           => $body,
            'message'        => $body,
        ];
    }

    public function toExpoPush(object $notifiable): array
    {
        $scheduledAt = $this->appointment->scheduled_at->format('D, M j \a\t g:i A');
        $service = $this->appointment->service?->name ?? 'A service';
        $locale = $notifiable->locale ?? 'ar';

        return [
            'to'    => $notifiable->expo_push_token,
            'title' => trans('notifications.appointment_cancellation_requested.title', [], $locale),
            'body'  => trans('notifications.appointment_cancellation_requested.body', ['service' => $service, 'time' => $scheduledAt], $locale),
            'data'  => [
                'type'           => 'appointment_cancellation_requested',
                'appointment_id' => $this->appointment->id,
            ],
            'sound' => 'default',
        ];
    }
}
