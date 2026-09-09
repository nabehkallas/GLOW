<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusChanged extends Notification
{
    use Queueable;

    public function __construct(public Order $order, public string $newStatus) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->locale ?? 'ar';
        $statusLabel = trans("notifications.statuses.{$this->newStatus}", [], $locale);

        return (new MailMessage)
            ->subject(trans('notifications.order.mail_subject', ['id' => $this->order->id, 'status' => $statusLabel], $locale))
            ->greeting(trans('notifications.greeting', ['name' => $notifiable->name], $locale))
            ->line(trans('notifications.order.mail_line', [
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
            'type'       => 'order_status_changed',
            'order_id'   => $this->order->id,
            'new_status' => $this->newStatus,
            'total'      => $this->order->total_amount,
            'message'    => trans('notifications.order.mail_line', [
                'id'     => $this->order->id,
                'total'  => $this->order->total_amount,
                'status' => $statusLabel,
            ], $locale),
        ];
    }
}
