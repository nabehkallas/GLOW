<?php

namespace App\Notifications;

use App\Models\ClientOrder;
use App\Notifications\Channels\ExpoChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClientOrderStatusChanged extends Notification
{
    use Queueable;

    public function __construct(public ClientOrder $order, public string $newStatus) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail', ExpoChannel::class];
    }

    public function toExpoPush(object $notifiable): array
    {
        $locale = $notifiable->locale ?? 'ar';
        $statusLabel = trans("notifications.statuses.{$this->newStatus}", [], $locale);

        return [
            'to'    => $notifiable->expo_push_token,
            'title' => trans('notifications.client_order.push_title', [], $locale),
            'body'  => trans('notifications.client_order.push_body', ['id' => $this->order->id, 'status' => $statusLabel], $locale),
            'data'  => [
                'type'       => 'client_order_status_changed',
                'order_id'   => $this->order->id,
                'new_status' => $this->newStatus,
            ],
            'sound' => 'default',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->locale ?? 'ar';
        $statusLabel = trans("notifications.statuses.{$this->newStatus}", [], $locale);

        return (new MailMessage)
            ->subject(trans('notifications.client_order.mail_subject', ['id' => $this->order->id, 'status' => $statusLabel], $locale))
            ->greeting(trans('notifications.greeting', ['name' => $notifiable->name], $locale))
            ->line(trans('notifications.client_order.mail_line', [
                'id'     => $this->order->id,
                'total'  => $this->order->total_amount,
                'status' => $statusLabel,
            ], $locale));
    }

    public function toArray(object $notifiable): array
    {
        $locale = $notifiable->locale ?? 'ar';
        $statusLabel = trans("notifications.statuses.{$this->newStatus}", [], $locale);

        return [
            'type'       => 'client_order_status_changed',
            'order_id'   => $this->order->id,
            'new_status' => $this->newStatus,
            'total'      => $this->order->total_amount,
            'message'    => trans('notifications.client_order.push_body', ['id' => $this->order->id, 'status' => $statusLabel], $locale),
        ];
    }
}
