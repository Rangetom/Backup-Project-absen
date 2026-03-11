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
        Schema::table('attendances', function (Blueprint $table) {
            $table->time('check_out_time')->nullable()->after('check_in_time');
            $table->string('check_out_photo')->nullable()->after('photo');
            $table->decimal('check_out_latitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('check_out_longitude', 10, 7)->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['check_out_time', 'check_out_photo', 'check_out_latitude', 'check_out_longitude']);
        });
    }
};
