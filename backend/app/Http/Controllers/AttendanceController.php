<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kehadiran;
use App\Models\Company;
use Carbon\Carbon;

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

            // Filter Role
            if ($request->has('role') && $request->role != '') {
                $query->whereHas('user', function($q) use ($request) {
                    $q->where('role', $request->role);
                });
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

            // Logic for ALPHA Status
            $isToday = $request->period == 'today' || !$request->has('period');
            if ($isToday) {
                $todayDate = now()->today();
                
                // Get all employees that SHOULD be present
                $userQuery = \App\Models\User::where('role', '!=', 'admin');
                if ($request->has('company_id') && $request->company_id != '') {
                    $userQuery->where('company_id', $request->company_id);
                }
                if ($request->has('role') && $request->role != '') {
                    $userQuery->where('role', $request->role);
                }
                if ($request->has('search') && $request->search != '') {
                    $userQuery->where('name', 'like', '%' . $request->search . '%');
                }
                
                $expectedUsers = $userQuery->get();
                $presentUserIds = $attendances->pluck('user_id')->toArray();
                
                foreach ($expectedUsers as $user) {
                    if (!in_array($user->id, $presentUserIds)) {
                        // Determine if ALPA or just "Belum Absen"
                        // Rule: Automatis alpha if not absen before jam pulang
                        $office = $user->company;
                        $timeOut = $office ? $office->time_out : '17:00:00';
                        $isPastDeadline = now()->isAfter(Carbon::parse($timeOut));
                        
                        // User requested to hide "BELUM HADIR"
                        if (!$isPastDeadline) continue;
                        
                        $status = 'ALPA';
                        
                        // If status filter is active, only include if matches ALPA
                        if ($request->has('status') && $request->status != '') {
                            if ($status !== $request->status) continue;
                        }

                        // Create a virtual attendance object
                        $virtualAttendance = new Kehadiran([
                            'user_id' => $user->id,
                            'status' => $status,
                        ]);
                        $virtualAttendance->created_at = $todayDate;
                        
                        // Load relation for the map operation later
                        $virtualAttendance->setRelation('user', $user);
                        
                        $attendances->push($virtualAttendance);
                    }
                }
            }

            $formatted = $attendances->map(function ($attendance) {
                if (!$attendance->user) {
                    // Try to load user if it's still missing
                    $attendance->load('user.company');
                }

                if (!$attendance->user) return null;

                return [
                    'id' => $attendance->id ?? 'virtual-' . $attendance->user_id,
                    'user' => [
                        'name' => $attendance->user->name,
                        'email' => $attendance->user->email,
                        'role' => $attendance->user->role,
                        'code' => $attendance->user->employee_code ?? 'EMP' . str_pad($attendance->user->id, 3, '0', STR_PAD_LEFT),
                        'company' => $attendance->user->company ? $attendance->user->company->name : 'N/A',
                    ],
                    'check_in_time' => $attendance->check_in_time ?? '--:--:--',
                    'check_out_time' => $attendance->check_out_time,
                    'status' => $attendance->status,
                    'late_duration' => $this->getLateDuration($attendance),
                    'location' => ($attendance->latitude && $attendance->longitude 
                        ? number_format($attendance->latitude, 6) . ', ' . number_format($attendance->longitude, 6)
                        : ($attendance->status === 'ALPA' || $attendance->status === 'BELUM HADIR' ? 'N/A' : 'Lokasi Kantor')) . ($attendance->office_name ? ' (' . $attendance->office_name . ')' : ''),
                    'photo_url' => $attendance->photo ? request()->schemeAndHttpHost() . '/storage/' . $attendance->photo : null,
                    'photo_checkout_url' => $attendance->check_out_photo ? request()->schemeAndHttpHost() . '/storage/' . $attendance->check_out_photo : null,
                    'description' => $attendance->description,
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
                    'has_checked_out' => false,
                    'check_in_time' => null,
                    'check_out_time' => null,
                    'status' => null,
                    'location' => null,
                    'office_settings' => null,
                    'date' => now()->format('l, F d, Y')
                ]);
            }

            return response()->json([
                'has_checked_in' => true,
                'has_checked_out' => $attendance->check_out_time ? true : false,
                'check_in_time' => date('h:i A', strtotime($attendance->check_in_time)),
                'check_out_time' => $attendance->check_out_time ? date('h:i A', strtotime($attendance->check_out_time)) : null,
                'status' => $attendance->status,
                'description' => $attendance->description,
                'late_duration' => $this->getLateDuration($attendance),

                'location' => ($attendance->latitude && $attendance->longitude 
                    ? 'Lat: ' . number_format($attendance->latitude, 6) . ', Lng: ' . number_format($attendance->longitude, 6)
                    : 'Main Office - Floor 3') . ($attendance->office_name ? ' (' . $attendance->office_name . ')' : ''),
                'office_settings' => [
                    'time_out' => \App\Models\Company::where('name', $attendance->office_name)->first()?->time_out ?? '17:00:00'
                ],
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

    public function updateStatus(Request $request, $id)
    {
        try {
            $request->validate([
                'status' => 'required|string|in:HADIR,TELAT,DITOLAK,ALPA,IZIN',
            ]);

            // Handle virtual ID (creation of record for ALPHA user)
            if (strpos($id, 'virtual-') === 0) {
                $userId = str_replace('virtual-', '', $id);
                $attendance = Kehadiran::create([
                    'user_id' => $userId,
                    'status' => $request->status,
                    'created_at' => now(),
                    // For manual intervention, we might want to mark it somehow?
                    // For now, just create the record.
                ]);
            } else {
                $attendance = Kehadiran::findOrFail($id);
                $attendance->update([
                    'status' => $request->status
                ]);
            }

            return response()->json([
                'message' => 'Status berhasil diperbarui',
                'attendance' => $attendance
            ]);
        } catch (\Exception $e) {
            \Log::error('Update status error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal memperbarui status'], 500);
        }
    }

    private function getLateDuration($attendance)

    {
        if ($attendance->status !== 'TELAT') {
            return null;
        }

        // Cari jam masuk kantor
        $office = Company::where('name', $attendance->office_name)->first();
        if (!$office) {
            // Fallback ke company default user
            $office = $attendance->user->company;
        }

        if (!$office || !$office->time_late) {
            return null;
        }

        try {
            $checkIn = Carbon::parse($attendance->check_in_time);
            $lateThreshold = Carbon::parse($office->time_late);

            if ($checkIn <= $lateThreshold) {
                return null;
            }

            $diff = $checkIn->diff($lateThreshold);
            $parts = [];
            
            if ($diff->h > 0) {
                $parts[] = $diff->h . ' jam';
            }
            if ($diff->i > 0) {
                $parts[] = $diff->i . ' menit';
            }
            
            if (empty($parts)) {
                return 'kurang dari 1 menit';
            }

            return implode(' ', $parts);
        } catch (\Exception $e) {
            return null;
        }
    }
}