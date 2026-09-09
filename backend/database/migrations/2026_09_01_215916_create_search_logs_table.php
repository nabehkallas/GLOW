<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('context'); // 'product' | 'salon' | 'appointment' | 'client'
            $table->string('term');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'context']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_logs');
    }
};
