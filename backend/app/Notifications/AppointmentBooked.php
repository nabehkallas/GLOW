<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AppointmentBooked extends Notification
{
    use Queueable;

    public function __construct(public Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        // Recipient is the salon owner, who uses salon-web (browser), not the
        // client-mobile app — there is no push channel for them yet (Item #10
        // will add one when salon-web becomes an Expo app).
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $scheduledAt = $this->appointment->scheduled_at->format('D, M j \a\t g:i A');
        $service = $this->appointment->service?->name ?? 'A service';
        $locale = $notifiable->locale ?? 'ar';

        $body = trans('notifications.appointment_booked.body', ['service' => $service, 'time' => $scheduledAt], $locale);

        return [
            'type'           => 'appointment_booked',
            'appointment_id' => $this->appointment->id,
            'client_name'    => $this->appointment->client?->name ?? 'A client',
            'service_name'   => $service,
            'scheduled_at'   => $this->appointment->scheduled_at->toDateTimeString(),
            'title'          => trans('notifications.appointment_booked.title', [], $locale),
            'body'           => $body,
            'message'        => $body,
        ];
    }
}
