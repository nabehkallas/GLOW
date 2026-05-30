<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salon_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('salon_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['image', 'video']);
            $table->string('path');
            $table->string('caption')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['salon_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salon_media');
    }
};
