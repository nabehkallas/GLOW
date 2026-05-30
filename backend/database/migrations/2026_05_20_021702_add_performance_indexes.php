<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('role');
        });

        Schema::table('salons', function (Blueprint $table) {
            $table->index('status');
            $table->index('city');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->index('status');
            $table->index('scheduled_at');
            $table->index('client_id');
            $table->index('salon_id');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index('status');
            $table->index('salon_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
        });

        Schema::table('salons', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['city']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['scheduled_at']);
            $table->dropIndex(['client_id']);
            $table->dropIndex(['salon_id']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['salon_id']);
        });
    }
};
