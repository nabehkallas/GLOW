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
            $table->decimal('client_price', 8, 2)->nullable()->after('price');
        });

        // Existing catalog rows: default the retail price to the wholesale
        // price so nothing is unpriced in the shop until admin adjusts it.
        DB::table('products')->whereNull('client_price')->update([
            'client_price' => DB::raw('price'),
        ]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('client_price');
        });
    }
};
