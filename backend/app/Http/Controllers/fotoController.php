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

        // ===== GET ALLOWED COMPANIES =====
        $allowedIds = $user->allowed_companies;
        $allCompanies = \App\Models\Company::all();
        
        $targetCompanies = $allCompanies;
        if ($allowedIds && !in_array('*', $allowedIds)) {
            $targetCompanies = $allCompanies->whereIn('id', $allowedIds);
        } elseif (!$allowedIds) {
            $targetCompanies = $allCompanies->where('id', $user->company_id);
        }

        if ($targetCompanies->isEmpty()) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke kantor manapun. Hubungi admin.'], 403);
        }

        // ===== VALIDASI LOKASI (Cek terhadap kantor yang diperbolehkan) =====
        $atCompany = null;
        $minDistance = floatval('INF');
        $isInRange = false;

        foreach ($targetCompanies as $comp) {
            $dist = $this->distance(
                $comp->latitude,
                $comp->longitude,
                $request->latitude,
                $request->longitude
            );
            
            $distInMeters = $dist * 1000;
            
            if ($distInMeters <= $comp->radius_km) {
                $isInRange = true;
                $atCompany = $comp;
                break; 
            }

            if ($distInMeters < $minDistance) {
                $minDistance = $distInMeters;
                // Simpan info jarak terdekat walaupun tidak masuk range (untuk pesan error)
                if (!$atCompany) $atCompany = $comp;
            }
        }

        if (!$isInRange) {
            return response()->json([
                'message' => 'Anda berada di luar area absensi kantor yang diizinkan. Jarak terdekat: ' . round($minDistance, 2) . ' meter ke ' . ($atCompany ? $atCompany->name : 'kantor')
            ], 403);
        }

        // ===== VALIDASI JAM ABSENSI (Gunakan setting dari kantor tempat absen) =====
        $setting = $atCompany; 
        $today = Carbon::today();
        $start = $today->copy()->setTimeFromTimeString($setting->time_in);
        $late = $today->copy()->setTimeFromTimeString($setting->time_late);
        $end = $today->copy()->setTimeFromTimeString($setting->time_out);

        if ($now < $start) {
            return response()->json(['message' => 'Absensi di ' . $setting->name . ' belum dibuka. Buka jam: ' . $setting->time_in], 403);
        }

        if ($now > $end) {
            return response()->json(['message' => 'Absensi di ' . $setting->name . ' sudah ditutup. Tutup jam: ' . $setting->time_out], 403);
        }

        $status = $now > $late ? 'TELAT' : 'HADIR';

        // Log debug
        \Log::info('DEBUG WAKTU ABSENSI', [
            'user' => $user->name,
            'office_assigned' => $setting->name,
            'office_at' => $atCompany->name,
            'current_time' => $now->format('H:i:s'),
        ]);
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
            'office_name' => $atCompany ? $atCompany->name : 'Unknown Office',
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