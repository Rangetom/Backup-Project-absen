<?php
// app/Http/Controllers/fotoController.php (perbaikan utama di sini: gunakan Carbon untuk perbandingan waktu yang lebih akurat)

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use App\Models\Kehadiran;
use App\Models\AttendanceSetting;
class fotoController extends Controller
{
    public function checkIn(Request $request)
    {
        $request->validate([
            'photo' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);
        $user = Auth::user();
        $now = Carbon::now();
        /*
        |--------------------------------------------------------------------------
        | VALIDASI JAM ABSENSI
        |--------------------------------------------------------------------------
        */
        /*
        |--------------------------------------------------------------------------
        | VALIDASI JAM ABSENSI
        |--------------------------------------------------------------------------
        */
        $setting = $user->company;

        if (!$setting) {
            return response()->json(['message' => 'Anda belum terdaftar di kantor manapun. Hubungi admin.'], 403);
        }

        // ===== VALIDASI WAKTU DENGAN CARBON (PERBAIKAN: bandingkan sebagai objek DateTime untuk akurasi) =====
        $today = Carbon::today();
        $start = $today->copy()->setTimeFromTimeString($setting->time_in);
        $late = $today->copy()->setTimeFromTimeString($setting->time_late);
        $end = $today->copy()->setTimeFromTimeString($setting->time_out);

        if ($now < $start) {
            return response()->json(['message' => 'Absensi belum dibuka'], 403);
        }

        if ($now > $end) {
            return response()->json(['message' => 'Absensi sudah ditutup'], 403);
        }

        $status = $now > $late ? 'TELAT' : 'HADIR';

        // Log debug (dipertahankan dan disesuaikan)
        \Log::info('DEBUG WAKTU ABSENSI', [
            'current_time' => $now->format('H:i:s'),
            'start_time' => $start->format('H:i:s'),
            'late_time' => $late->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'is_before_start' => $now < $start,
            'is_after_end' => $now > $end,
        ]);

        // ===== VALIDASI LOKASI =====
        $distance = $this->distance(
            $setting->latitude,
            $setting->longitude,
            $request->latitude,
            $request->longitude
        );

        if ($distance * 1000 > $setting->radius_km) {
            return response()->json([
                'message' => 'Anda berada di luar area absensi. Jarak Anda: ' . round($distance * 1000, 2) . ' meter, Radius: ' . $setting->radius_km . ' meter'
            ], 403);
        }
        /*
        |--------------------------------------------------------------------------
        | SIMPAN FOTO (BASE64 → STORAGE)
        |--------------------------------------------------------------------------
        */
        $base64 = preg_replace('#^data:image/\w+;base64,#i', '', $request->photo);
        $image = base64_decode($base64);
        $filename = 'fotoKehadiran/' . uniqid() . '.jpg';
        Storage::disk('public')->put($filename, $image);
        /*
        |--------------------------------------------------------------------------
        | SIMPAN KE DATABASE
        |--------------------------------------------------------------------------
        */
        $attendance = Kehadiran::create([
            'user_id' => $user->id,
            'photo' => $filename,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'check_in_time' => $now->format('H:i:s'),
            'status' => $status,
        ]);
        return response()->json([
            'message' => 'Check-in berhasil',
            'status' => $status,
            'check_in_time' => $attendance->check_in_time,
            'photo_url' => request()->schemeAndHttpHost() . '/storage/' . $filename,
        ], 201);
    }
    private function distance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) ** 2;
        return $earthRadius * (2 * atan2(sqrt($a), sqrt(1 - $a)));
    }
}