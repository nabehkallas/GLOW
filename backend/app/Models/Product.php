<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'price',
        'client_price',
        'stock',
        'image',
        'category_en',
        'category_ar',
        'is_active',
        'offer_price',
        'offer_client_price',
        'offer_starts_at',
        'offer_ends_at',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'client_price' => 'decimal:2',
            'is_active' => 'boolean',
            'offer_price' => 'decimal:2',
            'offer_client_price' => 'decimal:2',
            'offer_starts_at' => 'datetime',
            'offer_ends_at' => 'datetime',
        ];
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function clientOrderItems()
    {
        return $this->hasMany(ClientOrderItem::class);
    }

    public function attributes()
    {
        return $this->hasMany(ProductAttribute::class)->orderBy('sort_order');
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    // The product's own default tier set — used directly when there are no
    // variants, and inherited by any variant that has no tiers of its own.
    public function priceTiers()
    {
        return $this->hasMany(ProductPriceTier::class)->whereNull('product_variant_id')->orderBy('min_quantity');
    }

    public function isOfferActive(): bool
    {
        return $this->offer_price !== null
            && $this->offer_starts_at !== null
            && $this->offer_ends_at !== null
            && now()->between($this->offer_starts_at, $this->offer_ends_at);
    }

    public function priceForQuantity(int $qty, bool $client = false): float
    {
        if ($this->isOfferActive()) {
            return (float) ($client ? $this->offer_client_price : $this->offer_price);
        }

        $tier = $this->priceTiers->where('min_quantity', '<=', $qty)->sortByDesc('min_quantity')->first();
        $tierPrice = $tier ? ($client ? $tier->client_price : $tier->price) : null;

        if ($tierPrice !== null) {
            return (float) $tierPrice;
        }

        return (float) ($client ? $this->client_price : $this->price);
    }
}
