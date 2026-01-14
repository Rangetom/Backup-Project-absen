<?php

// database/migrations/xxxx_create_attendance_settings_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->double('office_latitude');
            $table->double('office_longitude');
            $table->double('radius_km')->default(1);
            $table->time('start_time');   // buka absensi
            $table->time('late_time');    // batas hadir
            $table->time('end_time');     // tutup absensi
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_settings');
    }
};
