<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('category_en')->nullable()->after('category');
            $table->string('category_ar')->nullable()->after('category_en');
        });

        DB::table('products')->whereNotNull('category')->update(['category_en' => DB::raw('category')]);

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('category')->nullable();
        });

        DB::table('products')->whereNotNull('category_en')->update(['category' => DB::raw('category_en')]);

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['category_en', 'category_ar']);
        });
    }
};
