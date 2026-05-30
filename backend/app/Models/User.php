<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'expo_push_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function salon()
    {
        return $this->hasOne(Salon::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'client_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isSalon(): bool
    {
        return $this->role === 'salon';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }
}
