<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashTransaction extends Model
{
    protected $fillable = ['salon_id', 'type', 'category', 'amount', 'note', 'date'];

    protected $casts = ['amount' => 'float', 'date' => 'date'];

    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }
}
