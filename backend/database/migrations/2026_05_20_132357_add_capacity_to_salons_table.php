<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salons', function (Blueprint $table) {
            $table->unsignedTinyInteger('capacity')->default(1)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('salons', function (Blueprint $table) {
            $table->dropColumn('capacity');
        });
    }
};
