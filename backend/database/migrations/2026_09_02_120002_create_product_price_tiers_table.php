<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_price_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            // Null = the product's default tier set (used directly for a no-variant
            // product, and inherited by any variant that has no tiers of its own).
            // Set = that variant's own tier set, which fully replaces the default.
            $table->foreignId('product_variant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('min_quantity');
            $table->decimal('price', 8, 2)->nullable();
            $table->decimal('client_price', 8, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_price_tiers');
    }
};
