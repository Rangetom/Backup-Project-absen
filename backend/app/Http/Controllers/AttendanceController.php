<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kehadiran;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Kehadiran::with('user.company');

            // Filter Search (Nama Karyawan)
            if ($request->has('search') && $request->search != '') {
                $query->whereHas('user', function($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                });
            }

            // Filter Company
            if ($request->has('company_id') && $request->company_id != '') {
                $query->whereHas('user', function($q) use ($request) {
                    $q->where('company_id', $request->company_id);
                });
            }

            // Filter Status
            if ($request->has('status') && $request->status != '') {
                $query->where('status', $request->status);
            }

            // Filter Period
            if ($request->has('period')) {
                if ($request->period == 'today') {
                    $query->whereDate('created_at', now()->today());
                } elseif ($request->period == 'week') {
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                } elseif ($request->period == 'month') {
                    $query->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]);
                }
            }

            $attendances = $query->latest('created_at')->get();

            $formatted = $attendances->map(function ($attendance) {
                if (!$attendance->user) {
                    return null;
                }

                return [
                    'id' => $attendance->id,
                    'user' => [
                        'name' => $attendance->user->name,
                        'email' => $attendance->user->email,
                        'code' => $attendance->user->employee_code ?? 'EMP' . str_pad($attendance->user->id, 3, '0', STR_PAD_LEFT),
                        'company' => $attendance->user->company ? $attendance->user->company->name : 'N/A',
                    ],
                    'check_in_time' => $attendance->check_in_time,
                    'status' => $attendance->status,
                    'location' => ($attendance->latitude && $attendance->longitude 
                        ? number_format($attendance->latitude, 6) . ', ' . number_format($attendance->longitude, 6)
                        : 'Lokasi Kantor') . ($attendance->office_name ? ' (' . $attendance->office_name . ')' : ''),
                    'photo_url' => request()->schemeAndHttpHost() . '/storage/' . $attendance->photo,
                    'date' => $attendance->created_at->format('d M Y'),
                ];
            })->filter()->values();

            return response()->json($formatted);
        } catch (\Exception $e) {
            \Log::error('Attendance fetch error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal mengambil data absensi'], 500);
        }
    }

    // Get today's attendance for authenticated user
    public function getTodayAttendance(Request $request)
    {
        try {
            $user = $request->user();
            $today = now()->format('Y-m-d');
            
            $attendance = Kehadiran::where('user_id', $user->id)
                ->whereDate('created_at', $today)
                ->latest()
                ->first();

            if (!$attendance) {
                return response()->json([
                    'has_checked_in' => false,
                    'check_in_time' => null,
                    'status' => null,
                    'location' => null,
                    'date' => now()->format('l, F d, Y')
                ]);
            }

            return response()->json([
                'has_checked_in' => true,
                'check_in_time' => date('h:i A', strtotime($attendance->check_in_time)),
                'status' => $attendance->status,
                'location' => ($attendance->latitude && $attendance->longitude 
                    ? 'Lat: ' . number_format($attendance->latitude, 6) . ', Lng: ' . number_format($attendance->longitude, 6)
                    : 'Main Office - Floor 3') . ($attendance->office_name ? ' (' . $attendance->office_name . ')' : ''),
                'date' => $attendance->created_at->format('l, F d, Y')
            ]);
        } catch (\Exception $e) {
            \Log::error('Today attendance fetch error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal mengambil data absensi hari ini'], 500);
        }
    }

    // Get monthly statistics for authenticated user
    public function getMonthlyStats(Request $request)
    {
        try {
            $user = $request->user();
            $startOfMonth = now()->startOfMonth();
            $endOfMonth = now()->endOfMonth();

            $attendances = Kehadiran::where('user_id', $user->id)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->get();

            $present = $attendances->where('status', 'HADIR')->count();
            $late = $attendances->where('status', 'TELAT')->count();
            
            // Calculate absent days (working days - total attendance)
            $totalDays = now()->day; // Days passed in current month
            $totalAttendance = $attendances->count();
            $absent = max(0, $totalDays - $totalAttendance);

            return response()->json([
                'present' => $present,
                'late' => $late,
                'absent' => $absent
            ]);
        } catch (\Exception $e) {
            \Log::error('Monthly stats fetch error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal mengambil statistik bulanan'], 500);
        }
    }
}