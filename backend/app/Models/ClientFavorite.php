<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientFavorite extends Model
{
    protected $fillable = ['user_id', 'salon_id'];

    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }
}
