<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'salon_id',
        'total_amount',
        'status',
        'notes',
        'delivered_at',
        'return_reason',
        'cancellation_reason',
        'cancel_from_status',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'delivered_at' => 'datetime',
        ];
    }

    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
