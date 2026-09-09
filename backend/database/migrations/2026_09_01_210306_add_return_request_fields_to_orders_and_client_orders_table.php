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
            $table->timestamp('delivered_at')->nullable()->after('status');
            $table->string('return_reason')->nullable()->after('notes');
        });

        Schema::table('client_orders', function (Blueprint $table) {
            $table->timestamp('delivered_at')->nullable()->after('status');
            $table->string('return_reason')->nullable()->after('notes');
        });

        // Best-effort backfill for orders already delivered (or since returned) before
        // this column existed — updated_at is the closest available proxy at this point.
        DB::table('orders')->whereIn('status', ['delivered', 'returned'])->update(['delivered_at' => DB::raw('updated_at')]);
        DB::table('client_orders')->whereIn('status', ['delivered', 'returned'])->update(['delivered_at' => DB::raw('updated_at')]);

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'return_requested'])
                ->default('pending')->change();
        });

        Schema::table('client_orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'return_requested'])
                ->default('pending')->change();
        });
    }

    public function down(): void
    {
        DB::table('orders')->where('status', 'return_requested')->update(['status' => 'delivered']);
        DB::table('client_orders')->where('status', 'return_requested')->update(['status' => 'delivered']);

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned'])
                ->default('pending')->change();
        });

        Schema::table('client_orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned'])
                ->default('pending')->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivered_at', 'return_reason']);
        });

        Schema::table('client_orders', function (Blueprint $table) {
            $table->dropColumn(['delivered_at', 'return_reason']);
        });
    }
};
