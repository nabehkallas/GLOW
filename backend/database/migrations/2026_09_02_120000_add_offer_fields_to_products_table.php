<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('offer_price', 8, 2)->nullable()->after('client_price');
            $table->decimal('offer_client_price', 8, 2)->nullable()->after('offer_price');
            $table->timestamp('offer_starts_at')->nullable()->after('offer_client_price');
            $table->timestamp('offer_ends_at')->nullable()->after('offer_starts_at');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['offer_price', 'offer_client_price', 'offer_starts_at', 'offer_ends_at']);
        });
    }
};
