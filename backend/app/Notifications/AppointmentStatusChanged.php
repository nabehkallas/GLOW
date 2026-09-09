<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\ExpoChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentStatusChanged extends Notification
{
    use Queueable;

    public function __construct(public Appointment $appointment, public string $newStatus) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail', ExpoChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $scheduledAt = $this->appointment->scheduled_at->format('D, M j \a\t g:i A');
        $locale = $notifiable->locale ?? 'ar';
        $statusLabel = trans("notifications.statuses.{$this->newStatus}", [], $locale);

        return (new MailMessage)
            ->subject(trans('notifications.appointment_status.mail_subject', ['status' => $statusLabel], $locale))
            ->greeting(trans('notifications.greeting', ['name' => $notifiable->name], $locale))
            ->line(trans('notifications.appointment_status.mail_line', [
                'service' => $this->appointment->service?->name,
                'time'    => $scheduledAt,
                'status'  => $statusLabel,
            ], $locale));
    }

    public function toArray(object $notifiable): array
    {
        $locale = $notifiable->locale ?? 'ar';
        $title = trans("notifications.appointment_status.{$this->newStatus}", [], $locale);

        return [
            'type'           => 'appointment_status_changed',
            'appointment_id' => $this->appointment->id,
            'new_status'     => $this->newStatus,
            'service_name'   => $this->appointment->service?->name,
            'scheduled_at'   => $this->appointment->scheduled_at->toDateTimeString(),
            'title'          => $title,
            'body'           => $this->appointment->service?->name,
            'message'        => $title,
        ];
    }

    public function toExpoPush(object $notifiable): array
    {
        $locale = $notifiable->locale ?? 'ar';

        return [
            'to'    => $notifiable->expo_push_token,
            'title' => trans("notifications.appointment_status.{$this->newStatus}", [], $locale),
            'body'  => $this->appointment->service?->name ?? trans('notifications.appointment_booked.title', [], $locale),
            'data'  => [
                'type'           => 'appointment_status_changed',
                'appointment_id' => $this->appointment->id,
                'new_status'     => $this->newStatus,
            ],
            'sound' => 'default',
        ];
    }
}
