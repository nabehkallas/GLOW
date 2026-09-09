<?php

namespace App\Notifications;

use App\Models\Salon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SalonApproved extends Notification
{
    use Queueable;

    public function __construct(public Salon $salon) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->locale ?? 'ar';

        return (new MailMessage)
            ->subject(trans('notifications.salon_approved.mail_subject', [], $locale))
            ->greeting(trans('notifications.greeting', ['name' => $notifiable->name], $locale))
            ->line(trans('notifications.salon_approved.mail_line', ['name' => $this->salon->name], $locale))
            ->action(trans('notifications.salon_approved.mail_action', [], $locale), url('/'))
            ->line(trans('notifications.salon_approved.mail_footer', [], $locale));
    }

    public function toArray(object $notifiable): array
    {
        $locale = $notifiable->locale ?? 'ar';

        return [
            'type'      => 'salon_approved',
            'salon_id'  => $this->salon->id,
            'salon_name' => $this->salon->name,
            'message'   => trans('notifications.salon_approved.mail_line', ['name' => $this->salon->name], $locale),
        ];
    }
}
