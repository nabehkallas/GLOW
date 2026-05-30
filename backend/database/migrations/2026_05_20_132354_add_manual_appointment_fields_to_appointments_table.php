<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('source')->default('app')->after('status');       // 'app' | 'manual'
            $table->string('client_name')->nullable()->after('source');       // walk-in name, no account needed
            $table->unsignedBigInteger('client_id')->nullable()->change();   // nullable for walk-ins
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['source', 'client_name']);
            $table->unsignedBigInteger('client_id')->nullable(false)->change();
        });
    }
};
