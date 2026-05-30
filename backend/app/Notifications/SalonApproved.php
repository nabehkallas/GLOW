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
        return (new MailMessage)
            ->subject('Your salon has been approved — GLOW')
            ->greeting("Hello {$notifiable->name},")
            ->line("Congratulations! Your salon **{$this->salon->name}** has been approved and is now live on GLOW.")
            ->action('Go to Dashboard', url('/'))
            ->line('Clients can now discover and book your services.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'salon_approved',
            'salon_id'  => $this->salon->id,
            'salon_name' => $this->salon->name,
            'message'   => "Your salon {$this->salon->name} has been approved.",
        ];
    }
}
