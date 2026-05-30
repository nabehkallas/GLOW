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
        $statusLabel = ucfirst($this->newStatus);

        return (new MailMessage)
            ->subject("Order #{$this->order->id} {$statusLabel} — GLOW")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your order **#{$this->order->id}** (total: \${$this->order->total_amount}) status has changed to **{$this->newStatus}**.");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'order_status_changed',
            'order_id'   => $this->order->id,
            'new_status' => $this->newStatus,
            'total'      => $this->order->total_amount,
            'message'    => "Order #{$this->order->id} is now {$this->newStatus}.",
        ];
    }
}
