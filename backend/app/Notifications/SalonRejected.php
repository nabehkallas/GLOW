<?php

namespace App\Notifications;

use App\Models\Salon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SalonRejected extends Notification
{
    use Queueable;

    public function __construct(public Salon $salon, public string $reason) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->locale ?? 'ar';

        return (new MailMessage)
            ->subject(trans('notifications.salon_rejected.mail_subject', [], $locale))
            ->greeting(trans('notifications.greeting', ['name' => $notifiable->name], $locale))
            ->line(trans('notifications.salon_rejected.mail_line', ['name' => $this->salon->name], $locale))
            ->line(trans('notifications.salon_rejected.mail_reason', ['reason' => $this->reason], $locale))
            ->line(trans('notifications.salon_rejected.mail_footer', [], $locale));
    }

    public function toArray(object $notifiable): array
    {
        $locale = $notifiable->locale ?? 'ar';

        return [
            'type'       => 'salon_rejected',
            'salon_id'   => $this->salon->id,
            'salon_name' => $this->salon->name,
            'reason'     => $this->reason,
            'message'    => trans('notifications.salon_rejected.mail_line', ['name' => $this->salon->name], $locale) . ' ' . trans('notifications.salon_rejected.mail_reason', ['reason' => $this->reason], $locale),
        ];
    }
}
