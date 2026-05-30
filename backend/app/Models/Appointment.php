<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'client_id',
        'salon_id',
        'salon_service_id',
        'scheduled_at',
        'status',
        'source',
        'client_name',
        'notes',
        'price_at_booking',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'price_at_booking' => 'decimal:2',
        ];
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

    public function service()
    {
        return $this->belongsTo(SalonService::class, 'salon_service_id');
    }
}
