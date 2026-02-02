<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kehadiran;
use App\Models\User;
use App\Models\Company;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function getSummary()
    {
        try {
            $today = Carbon::today();
            $totalEmployees = User::where('role', 'karyawan')->count();

            $startOfMonth = Carbon::now()->startOfMonth();
            $workingDaysSoFar = now()->diffInDaysFiltered(function (Carbon $date) {
                return !$date->isWeekend();
            }, $startOfMonth) + 1;

            // 1. Overall Stats
            $totalPresentToday = Kehadiran::whereDate('created_at', $today)->where('status', 'HADIR')->count();
            $totalLateToday = Kehadiran::whereDate('created_at', $today)->where('status', 'TELAT')->count();
            
            $attendanceRate = $totalEmployees > 0 ? round((($totalPresentToday + $totalLateToday) / $totalEmployees) * 100, 1) : 0;
            
            $totalLateAllTime = Kehadiran::where('status', 'TELAT')->count();
            $totalAttendancesAllTime = Kehadiran::count();
            $lateRate = $totalAttendancesAllTime > 0 ? round(($totalLateAllTime / $totalAttendancesAllTime) * 100, 1) : 0;

            // 2. Today's Distribution
            $todayAbsent = max(0, $totalEmployees - ($totalPresentToday + $totalLateToday));

            $todayDistribution = [
                ['name' => 'Present', 'value' => $totalPresentToday, 'color' => '#10b981'],
                ['name' => 'Late', 'value' => $totalLateToday, 'color' => '#f59e0b'],
                ['name' => 'Absent', 'value' => $todayAbsent, 'color' => '#ef4444'],
            ];

            // 3. Weekly Trend (Last 7 Days)
            $weeklyTrend = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $dayName = $date->format('D');
                
                $present = Kehadiran::whereDate('created_at', $date)->where('status', 'HADIR')->count();
                $late = Kehadiran::whereDate('created_at', $date)->where('status', 'TELAT')->count();
                $absent = max(0, $totalEmployees - ($present + $late));

                $weeklyTrend[] = [
                    'day' => $dayName,
                    'present' => $present,
                    'late' => $late,
                    'absent' => $absent
                ];
            }

            // 4. Monthly Trend (Last 6 Months)
            $sixMonthTrend = [];
            for ($i = 5; $i >= 0; $i--) {
                $monthDate = Carbon::today()->subMonths($i);
                $monthName = $monthDate->format('M');
                
                $present = Kehadiran::whereMonth('created_at', $monthDate->month)
                    ->whereYear('created_at', $monthDate->year)
                    ->where('status', 'HADIR')->count();
                $late = Kehadiran::whereMonth('created_at', $monthDate->month)
                    ->whereYear('created_at', $monthDate->year)
                    ->where('status', 'TELAT')->count();
                
                $expectedAttendance = $totalEmployees * 22; 
                $absent = max(0, $expectedAttendance - ($present + $late));

                $sixMonthTrend[] = [
                    'month' => $monthName,
                    'present' => $present,
                    'late' => $late,
                    'absent' => $absent
                ];
            }

            // 5. Department Stats (Group by Company) - Scoped to Current Month
            $departmentStats = [];
            $companies = Company::withCount(['users' => function($query) {
                $query->where('role', 'karyawan');
            }])->get();

            foreach ($companies as $company) {
                $compPresent = Kehadiran::whereHas('user', function($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->whereBetween('created_at', [$startOfMonth, now()])
                  ->where('status', 'HADIR')->count();

                $compLate = Kehadiran::whereHas('user', function($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->whereBetween('created_at', [$startOfMonth, now()])
                  ->where('status', 'TELAT')->count();

                $totalCompEmployees = $company->users_count;
                $expectedCompAttendance = $totalCompEmployees * $workingDaysSoFar;

                $departmentStats[] = [
                    'dept' => $company->name,
                    'present' => $expectedCompAttendance > 0 ? round(($compPresent / $expectedCompAttendance) * 100, 1) : 0,
                    'late' => $expectedCompAttendance > 0 ? round(($compLate / $expectedCompAttendance) * 100, 1) : 0,
                ];
            }

            // 6. Check-in Time Distribution (Today)
            $timeDistribution = [];
            $hours = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00'];
            foreach ($hours as $time) {
                $count = Kehadiran::whereDate('created_at', $today)
                    ->where('check_in_time', '>=', $time)
                    ->where('check_in_time', '<', Carbon::createFromTimeString($time)->addMinutes(30)->format('H:i:s'))
                    ->count();
                
                $timeDistribution[] = [
                    'time' => $time,
                    'checkins' => $count
                ];
            }

            return response()->json([
                'overallStats' => [
                    'attendanceRate' => $attendanceRate,
                    'lateRate' => $lateRate,
                    'absenceRate' => 100 - $attendanceRate, // Simplified
                    'totalPresent' => Kehadiran::whereDate('created_at', $today)->count(),
                ],
                'todayDistribution' => $todayDistribution,
                'weeklyTrend' => $weeklyTrend,
                'sixMonthTrend' => $sixMonthTrend,
                'departmentStats' => $departmentStats,
                'timeDistribution' => $timeDistribution
            ]);

        } catch (\Exception $e) {
            \Log::error('Report summary error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal mengambil data laporan'], 500);
        }
    }

    public function getUserSummary(Request $request)
    {
        try {
            $user = $request->user();
            $targetUserId = $request->user_id;

            // Jika bukan admin, hanya bisa lihat data sendiri
            if (!$user || ($user->role !== 'admin' && $targetUserId && $targetUserId != $user->id)) {
                $targetUserId = $user->id;
            }

            if (!$targetUserId) {
                $targetUserId = $user->id;
            }

            $targetUser = User::find($targetUserId);
            if (!$targetUser) {
                return response()->json(['error' => 'User tidak ditemukan'], 404);
            }

            $today = Carbon::today();
            $startOfWeek = Carbon::now()->startOfWeek();
            $startOfMonth = Carbon::now()->startOfMonth();
            $startOfYear = Carbon::now()->startOfYear();
            
            $getStatsForRange = function($start, $end) use ($targetUserId) {
                // Ensure $start and $end are Carbon instances
                $start = Carbon::parse($start)->startOfDay();
                $end = Carbon::parse($end)->endOfDay();

                $workingDays = $start->diffInDaysFiltered(function (Carbon $date) {
                    return !$date->isWeekend();
                }, $end);
                
                // If today is a weekday, include it
                if (!now()->isWeekend()) {
                    $workingDays += 1;
                }

                $stats = Kehadiran::where('user_id', $targetUserId)
                    ->whereBetween('created_at', [$start, $end])
                    ->selectRaw("COUNT(CASE WHEN status = 'HADIR' THEN 1 END) as hadir_count")
                    ->selectRaw("COUNT(CASE WHEN status = 'TELAT' THEN 1 END) as telat_count")
                    ->first();

                $totalAttended = $stats->hadir_count + $stats->telat_count;
                $attendanceRate = $workingDays > 0 ? round(($totalAttended / $workingDays) * 100, 1) : 0;
                $lateRate = $totalAttended > 0 ? round(($stats->telat_count / $totalAttended) * 100, 1) : 0;
                $absenceRate = max(0, 100 - $attendanceRate);

                return [
                    'hadir' => (int)$stats->hadir_count,
                    'telat' => (int)$stats->telat_count,
                    'absen' => (int)max(0, $workingDays - $totalAttended),
                    'attendanceRate' => $attendanceRate,
                    'lateRate' => $lateRate,
                    'absenceRate' => $absenceRate,
                    'totalWorkingDays' => $workingDays
                ];
            };

            $timeframeStats = [
                'week' => $getStatsForRange($startOfWeek, now()),
                'month' => $getStatsForRange($startOfMonth, now()),
                'year' => $getStatsForRange($startOfYear, now())
            ];

            // 2. Weekly Trend (Last 7 Days)
            $weeklyTrend = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $dayName = $date->format('D');
                
                $status = Kehadiran::where('user_id', $targetUserId)
                    ->whereDate('created_at', $date)
                    ->first();

                $weeklyTrend[] = [
                    'day' => $dayName,
                    'status' => $status ? $status->status : 'ABSEN',
                    'present' => ($status && $status->status === 'HADIR') ? 1 : 0,
                    'late' => ($status && $status->status === 'TELAT') ? 1 : 0,
                    'absent' => (!$status && !$date->isWeekend()) ? 1 : 0
                ];
            }

            // 3. Monthly Trend (Last 6 Months)
            $sixMonthTrend = [];
            for ($i = 5; $i >= 0; $i--) {
                $monthDate = Carbon::today()->subMonths($i);
                $monthName = $monthDate->format('M');
                
                $present = Kehadiran::where('user_id', $targetUserId)
                    ->whereMonth('created_at', $monthDate->month)
                    ->whereYear('created_at', $monthDate->year)
                    ->where('status', 'HADIR')->count();
                $late = Kehadiran::where('user_id', $targetUserId)
                    ->whereMonth('created_at', $monthDate->month)
                    ->whereYear('created_at', $monthDate->year)
                    ->where('status', 'TELAT')->count();
                
                // Assuming 22 working days per month
                $absent = max(0, 22 - ($present + $late));

                $sixMonthTrend[] = [
                    'month' => $monthName,
                    'present' => $present,
                    'late' => $late,
                    'absent' => $absent
                ];
            }

            return response()->json([
                'user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'role' => $targetUser->role,
                    'avatar' => strtoupper(substr($targetUser->name, 0, 1))
                ],
                'overallStats' => $timeframeStats['month'], // Default for backwards compatibility
                'timeframeStats' => $timeframeStats,
                'weeklyTrend' => $weeklyTrend,
                'sixMonthTrend' => $sixMonthTrend
            ]);

        } catch (\Exception $e) {
            \Log::error('User report summary error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal mengambil data laporan user'], 500);
        }
    }

    public function getEmployeesSummary()
    {
        try {
            $startOfMonth = Carbon::now()->startOfMonth();
            $workingDaysSoFar = now()->diffInDaysFiltered(function (Carbon $date) {
                return !$date->isWeekend();
            }, $startOfMonth) + 1;

            $summaries = User::whereIn('role', ['karyawan', 'magang'])
                ->leftJoin('attendances', function($join) use ($startOfMonth) {
                    $join->on('users.id', '=', 'attendances.user_id')
                         ->whereBetween('attendances.created_at', [$startOfMonth, now()]);
                })
                ->select(
                    'users.id',
                    'users.name',
                    'users.role',
                    DB::raw("COUNT(CASE WHEN attendances.status = 'HADIR' THEN 1 END) as hadir"),
                    DB::raw("COUNT(CASE WHEN attendances.status = 'TELAT' THEN 1 END) as telat")
                )
                ->groupBy('users.id', 'users.name', 'users.role')
                ->get();

            $result = $summaries->map(function($item) use ($workingDaysSoFar) {
                $totalAttended = $item->hadir + $item->telat;
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'role' => ucfirst($item->role),
                    'hadir' => (int)$item->hadir,
                    'telat' => (int)$item->telat,
                    'absen' => (int)max(0, $workingDaysSoFar - $totalAttended),
                    'avatar' => strtoupper(substr($item->name, 0, 1))
                ];
            });

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error('Employees summary error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal mengambil data ringkasan karyawan'], 500);
        }
    }
}
