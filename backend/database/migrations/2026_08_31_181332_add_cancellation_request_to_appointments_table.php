<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled', 'cancellation_requested'])
                ->default('pending')->change();
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('cancellation_reason')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        DB::table('appointments')->where('status', 'cancellation_requested')->update(['status' => 'confirmed']);

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('cancellation_reason');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])
                ->default('pending')->change();
        });
    }
};
