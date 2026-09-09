<?php

namespace App\Notifications;

use App\Models\ClientOrder;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class OrderReturnRequested extends Notification
{
    use Queueable;

    /**
     * @param Order|ClientOrder $order
     * @param string $orderType 'b2b' (salon restock) or 'b2c' (client shop)
     */
    public function __construct(public $order, public string $orderType) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        $isB2b = $this->orderType === 'b2b';
        $name  = $isB2b ? $this->order->salon->name : $this->order->client->name;
        $locale = $notifiable->locale ?? 'ar';

        return (new WebPushMessage)
            ->title(trans('notifications.order_return_requested.title', [], $locale))
            ->body(trans('notifications.order_return_requested.body', ['id' => $this->order->id, 'name' => $name], $locale))
            ->data([
                'type'       => 'order_return_requested',
                'order_id'   => $this->order->id,
                'order_type' => $this->orderType,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $isB2b = $this->orderType === 'b2b';
        $name  = $isB2b ? $this->order->salon->name : $this->order->client->name;
        $locale = $notifiable->locale ?? 'ar';
        $title = trans('notifications.order_return_requested.title', [], $locale);
        $body = trans('notifications.order_return_requested.body', ['id' => $this->order->id, 'name' => $name], $locale);

        return [
            'type'       => 'order_return_requested',
            'order_type' => $this->orderType,
            'order_id'   => $this->order->id,
            'total'      => $this->order->total_amount,
            'name'       => $name,
            'message'    => "{$title}: {$body}",
        ];
    }
}
