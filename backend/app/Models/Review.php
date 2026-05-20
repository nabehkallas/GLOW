<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'client_id',
        'salon_id',
        'appointment_id',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
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

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
