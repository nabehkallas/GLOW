<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'product_id',
        'sku',
        'combination_key',
        'price',
        'client_price',
        'stock',
        'image',
        'is_active',
        'offer_price',
        'offer_client_price',
        'offer_starts_at',
        'offer_ends_at',
    ];

    protected function casts(): array
    {
        return [
            'price'        => 'decimal:2',
            'client_price' => 'decimal:2',
            'is_active'    => 'boolean',
            'offer_price' => 'decimal:2',
            'offer_client_price' => 'decimal:2',
            'offer_starts_at' => 'datetime',
            'offer_ends_at' => 'datetime',
        ];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function attributeValues()
    {
        return $this->belongsToMany(ProductAttributeValue::class, 'product_variant_attribute_values')
            ->withPivot([]);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function clientOrderItems()
    {
        return $this->hasMany(ClientOrderItem::class);
    }

    // This variant's own tier overrides only (product_variant_id = this id).
    public function priceTiers()
    {
        return $this->hasMany(ProductPriceTier::class, 'product_variant_id')->orderBy('min_quantity');
    }

    public function isOfferActive(): bool
    {
        return $this->offer_price !== null
            && $this->offer_starts_at !== null
            && $this->offer_ends_at !== null
            && now()->between($this->offer_starts_at, $this->offer_ends_at);
    }

    // Resolution order: own offer -> inherited product offer -> own tiers ->
    // product's default tiers -> own price -> product's base price.
    public function priceForQuantity(int $qty, bool $client = false): float
    {
        if ($this->isOfferActive()) {
            return (float) ($client ? $this->offer_client_price : $this->offer_price);
        }

        if ($this->product->isOfferActive()) {
            return (float) ($client ? $this->product->offer_client_price : $this->product->offer_price);
        }

        $tier = $this->priceTiers->where('min_quantity', '<=', $qty)->sortByDesc('min_quantity')->first();
        $tierPrice = $tier ? ($client ? $tier->client_price : $tier->price) : null;

        if ($tierPrice !== null) {
            return (float) $tierPrice;
        }

        if ($this->priceTiers->isEmpty()) {
            $productTier = $this->product->priceTiers->where('min_quantity', '<=', $qty)->sortByDesc('min_quantity')->first();
            $productTierPrice = $productTier ? ($client ? $productTier->client_price : $productTier->price) : null;

            if ($productTierPrice !== null) {
                return (float) $productTierPrice;
            }
        }

        $ownPrice = $client ? $this->client_price : $this->price;

        return (float) ($ownPrice ?? ($client ? $this->product->client_price : $this->product->price));
    }
}
