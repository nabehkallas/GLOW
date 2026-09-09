<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashTransaction extends Model
{
    protected $fillable = ['salon_id', 'order_id', 'client_order_id', 'type', 'category', 'amount', 'note', 'date'];

    protected $casts = ['amount' => 'float', 'date' => 'date'];

    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function clientOrder()
    {
        return $this->belongsTo(ClientOrder::class);
    }
}
