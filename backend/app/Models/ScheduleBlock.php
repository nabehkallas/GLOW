<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleBlock extends Model
{
    protected $fillable = [
        'salon_id',
        'salon_service_id',
        'starts_at',
        'duration_minutes',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
        ];
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
