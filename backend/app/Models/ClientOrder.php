<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientOrder extends Model
{
    protected $fillable = [
        'client_id',
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

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function items()
    {
        return $this->hasMany(ClientOrderItem::class);
    }
}
