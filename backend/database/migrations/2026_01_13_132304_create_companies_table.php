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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->integer('radius_km')->default(100); // dalam meter sebenarnya, tapi nama kolom km (nanti kita pakai sbg meter) atau ubah jadi radius_meters
            $table->time('time_in')->default('08:00:00'); // start_time
            $table->time('time_late')->default('08:15:00'); // late_time
            $table->time('time_out')->default('17:00:00'); // end_time
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
