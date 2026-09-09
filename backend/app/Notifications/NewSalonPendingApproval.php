<?php

namespace App\Notifications;

use App\Models\Salon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewSalonPendingApproval extends Notification
{
    use Queueable;

    public function __construct(public Salon $salon) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail', WebPushChannel::class];
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        $locale = $notifiable->locale ?? 'ar';

        return (new WebPushMessage)
            ->title(trans('notifications.salon_pending.push_title', [], $locale))
            ->body(trans('notifications.salon_pending.push_body', ['name' => $this->salon->name, 'city' => $this->salon->city], $locale))
            ->data([
                'type'     => 'salon_pending_approval',
                'salon_id' => $this->salon->id,
            ]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->locale ?? 'ar';

        return (new MailMessage)
            ->subject(trans('notifications.salon_pending.mail_subject', [], $locale))
            ->greeting(trans('notifications.greeting', ['name' => $notifiable->name], $locale))
            ->line(trans('notifications.salon_pending.mail_line', ['name' => $this->salon->name, 'city' => $this->salon->city], $locale))
            ->action(trans('notifications.salon_pending.mail_action', [], $locale), url('/salons/' . $this->salon->id));
    }

    public function toArray(object $notifiable): array
    {
        $locale = $notifiable->locale ?? 'ar';

        return [
            'type'       => 'salon_pending_approval',
            'salon_id'   => $this->salon->id,
            'salon_name' => $this->salon->name,
            'city'       => $this->salon->city,
            'message'    => trans('notifications.salon_pending.push_body', ['name' => $this->salon->name, 'city' => $this->salon->city], $locale),
        ];
    }
}
