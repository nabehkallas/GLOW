<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientOrderItem extends Model
{
    protected $fillable = [
        'client_order_id',
        'product_id',
        'product_variant_id',
        'quantity',
        'unit_price',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
        ];
    }

    public function clientOrder()
    {
        return $this->belongsTo(ClientOrder::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function getSubtotalAttribute(): float
    {
        return $this->quantity * $this->unit_price;
    }
}
