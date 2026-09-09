<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('cancellation_reason')->nullable()->after('return_reason');
            $table->string('cancel_from_status')->nullable()->after('cancellation_reason');
        });

        Schema::table('client_orders', function (Blueprint $table) {
            $table->string('cancellation_reason')->nullable()->after('return_reason');
            $table->string('cancel_from_status')->nullable()->after('cancellation_reason');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'return_requested', 'cancellation_requested'])
                ->default('pending')->change();
        });

        Schema::table('client_orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'return_requested', 'cancellation_requested'])
                ->default('pending')->change();
        });
    }

    public function down(): void
    {
        DB::table('orders')->where('status', 'cancellation_requested')->update(['status' => DB::raw("COALESCE(cancel_from_status, 'confirmed')")]);
        DB::table('client_orders')->where('status', 'cancellation_requested')->update(['status' => DB::raw("COALESCE(cancel_from_status, 'confirmed')")]);

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'return_requested'])
                ->default('pending')->change();
        });

        Schema::table('client_orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'return_requested'])
                ->default('pending')->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['cancellation_reason', 'cancel_from_status']);
        });

        Schema::table('client_orders', function (Blueprint $table) {
            $table->dropColumn(['cancellation_reason', 'cancel_from_status']);
        });
    }
};
