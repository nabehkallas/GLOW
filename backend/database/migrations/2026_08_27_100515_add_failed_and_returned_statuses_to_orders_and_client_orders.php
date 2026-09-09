<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned'])
                ->default('pending')->change();
        });

        Schema::table('client_orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned'])
                ->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
                ->default('pending')->change();
        });

        Schema::table('client_orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
                ->default('pending')->change();
        });
    }
};
