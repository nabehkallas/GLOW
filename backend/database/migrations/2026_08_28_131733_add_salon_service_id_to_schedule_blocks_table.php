<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('schedule_blocks', function (Blueprint $table) {
            $table->foreignId('salon_service_id')->nullable()->after('salon_id')->constrained('salon_services')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedule_blocks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('salon_service_id');
        });
    }
};
