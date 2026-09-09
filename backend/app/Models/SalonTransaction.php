<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalonTransaction extends Model
{
    protected $fillable = [
        'salon_id',
        'type',
        'category',
        'amount',
        'comment',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'date' => 'date',
        ];
    }

    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }
}
