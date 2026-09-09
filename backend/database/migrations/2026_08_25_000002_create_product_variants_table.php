<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku')->nullable();
            // Sorted "attributeId:valueId|attributeId:valueId" — lets "generate missing
            // combinations" be one indexed lookup instead of N pivot queries.
            $table->string('combination_key');
            $table->decimal('price', 8, 2)->nullable();        // wholesale override; null = fall back to products.price
            $table->decimal('client_price', 8, 2)->nullable(); // retail override; null = fall back to products.client_price
            $table->integer('stock')->default(0);
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['product_id', 'combination_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
