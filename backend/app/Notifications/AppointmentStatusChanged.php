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

    private const STATUS_LABELS = [
        'confirmed'  => ['ar' => 'تم تأكيد موعدك', 'en' => 'confirmed'],
        'completed'  => ['ar' => 'اكتمل موعدك',    'en' => 'completed'],
        'cancelled'  => ['ar' => 'تم إلغاء موعدك', 'en' => 'cancelled'],
    ];

    public function __construct(public Appointment $appointment, public string $newStatus) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail', ExpoChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $scheduledAt = $this->appointment->scheduled_at->format('D, M j \a\t g:i A');
        $statusLabel = ucfirst($this->newStatus);

        return (new MailMessage)
            ->subject("Appointment {$statusLabel} — GLOW")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your appointment for **{$this->appointment->service?->name}** on {$scheduledAt} has been **{$this->newStatus}**.");
    }

    public function toArray(object $notifiable): array
    {
        $arLabel = self::STATUS_LABELS[$this->newStatus]['ar'] ?? $this->newStatus;

        return [
            'type'           => 'appointment_status_changed',
            'appointment_id' => $this->appointment->id,
            'new_status'     => $this->newStatus,
            'service_name'   => $this->appointment->service?->name,
            'scheduled_at'   => $this->appointment->scheduled_at->toDateTimeString(),
            'title'          => $arLabel,
            'body'           => $this->appointment->service?->name,
            'message'        => "Your appointment for {$this->appointment->service?->name} has been {$this->newStatus}.",
        ];
    }

    public function toExpoPush(object $notifiable): array
    {
        $arLabel = self::STATUS_LABELS[$this->newStatus]['ar'] ?? $this->newStatus;

        return [
            'to'    => $notifiable->expo_push_token,
            'title' => $arLabel,
            'body'  => $this->appointment->service?->name ?? 'موعدك',
            'data'  => [
                'type'           => 'appointment_status_changed',
                'appointment_id' => $this->appointment->id,
                'new_status'     => $this->newStatus,
            ],
            'sound' => 'default',
        ];
    }
}
