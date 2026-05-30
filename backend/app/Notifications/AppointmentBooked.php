<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\ExpoChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AppointmentBooked extends Notification
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

        return [
            'type'           => 'appointment_booked',
            'appointment_id' => $this->appointment->id,
            'client_name'    => $this->appointment->client?->name ?? 'A client',
            'service_name'   => $this->appointment->service?->name ?? 'A service',
            'scheduled_at'   => $this->appointment->scheduled_at->toDateTimeString(),
            'title'          => 'حجز جديد',
            'body'           => "حجز {$this->appointment->service?->name} – {$scheduledAt}",
            'message'        => "New booking: {$this->appointment->service?->name} on {$scheduledAt}",
        ];
    }

    public function toExpoPush(object $notifiable): array
    {
        $scheduledAt = $this->appointment->scheduled_at->format('D, M j \a\t g:i A');

        return [
            'to'    => $notifiable->expo_push_token,
            'title' => 'حجز جديد',
            'body'  => "{$this->appointment->client?->name} – {$this->appointment->service?->name} – {$scheduledAt}",
            'data'  => [
                'type'           => 'appointment_booked',
                'appointment_id' => $this->appointment->id,
            ],
            'sound' => 'default',
        ];
    }
}
