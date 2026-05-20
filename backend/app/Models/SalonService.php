<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalonService extends Model
{
    protected $fillable = [
        'salon_id',
        'name',
        'description',
        'price',
        'duration_minutes',
        'category',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
