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
        return (new MailMessage)
            ->subject('Your salon application was not approved — GLOW')
            ->greeting("Hello {$notifiable->name},")
            ->line("Unfortunately, your salon **{$this->salon->name}** was not approved.")
            ->line("**Reason:** {$this->reason}")
            ->line('Please contact support if you have questions.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'salon_rejected',
            'salon_id'   => $this->salon->id,
            'salon_name' => $this->salon->name,
            'reason'     => $this->reason,
            'message'    => "Your salon {$this->salon->name} was not approved: {$this->reason}",
        ];
    }
}
