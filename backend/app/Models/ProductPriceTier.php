<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductPriceTier extends Model
{
    protected $fillable = [
        'product_id',
        'product_variant_id',
        'min_quantity',
        'price',
        'client_price',
    ];

    protected function casts(): array
    {
        return [
            'price'        => 'decimal:2',
            'client_price' => 'decimal:2',
        ];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
