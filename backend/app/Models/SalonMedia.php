<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalonMedia extends Model
{
    protected $table = 'salon_media';

    protected $fillable = ['salon_id', 'type', 'path', 'caption', 'sort_order'];

    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }
}
