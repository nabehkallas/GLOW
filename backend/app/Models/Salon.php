<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Salon extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'address',
        'city',
        'latitude',
        'longitude',
        'logo',
        'license_number',
        'status',
        'capacity',
        'rejection_reason',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function services()
    {
        return $this->hasMany(SalonService::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function workingHours()
    {
        return $this->hasMany(WorkingHour::class)->orderBy('day_of_week');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function media()
    {
        return $this->hasMany(SalonMedia::class);
    }

    public function favorites()
    {
        return $this->hasMany(ClientFavorite::class);
    }

    public function getAverageRatingAttribute(): ?float
    {
        $avg = $this->reviews()->avg('rating');
        return $avg ? round($avg, 1) : null;
    }

    public function getReviewsCountAttribute(): int
    {
        return $this->reviews()->count();
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function distanceFrom(float $lat, float $lng): ?float
    {
        if ($this->latitude === null || $this->longitude === null) {
            return null;
        }

        $earthRadius = 6371;
        $dLat = deg2rad($this->latitude - $lat);
        $dLng = deg2rad($this->longitude - $lng);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat)) * cos(deg2rad($this->latitude)) * sin($dLng / 2) ** 2;

        return round($earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a)), 2);
    }
}
