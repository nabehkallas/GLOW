<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasPushSubscriptions, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'locale',
        'expo_push_token',
        'is_super_admin',
        'permissions',
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
            'is_super_admin' => 'boolean',
            'permissions' => 'array',
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

    public function clientOrders()
    {
        return $this->hasMany(ClientOrder::class, 'client_id');
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

    public function hasPermission(string $key): bool
    {
        return $this->is_super_admin || in_array($key, $this->permissions ?? [], true);
    }
}
