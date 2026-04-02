<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kehadiran;
use App\Models\User;
use App\Models\Company;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    public function getSummary()
    {
        try {
            $today = Carbon::today();
            // Count employees who already existed today
            $totalEmployees = User::where('role', '!=', 'admin')
                ->where('created_at', '<=', $today->endOfDay())
                ->count();

            $startOfMonth = Carbon::now()->startOfMonth();
            $workingDaysSoFar = now()->diffInDaysFiltered(function (Carbon $date) {
                return !$date->isWeekend();
            }, $startOfMonth) + 1;

            // 1. Overall Stats
            $totalPresentToday = Kehadiran::whereDate('created_at', $today)
                ->whereHas('user', function($q) { $q->where('role', '!=', 'admin'); })
                ->where('status', 'HADIR')->count();
            $totalLateToday = Kehadiran::whereDate('created_at', $today)
                ->whereHas('user', function($q) { $q->where('role', '!=', 'admin'); })
                ->where('status', 'TELAT')->count();
            
            $attendanceRate = $totalEmployees > 0 ? round((($totalPresentToday + $totalLateToday) / $totalEmployees) * 100, 1) : 0;
            
            $totalLateAllTime = Kehadiran::whereHas('user', function($q) { $q->where('role', '!=', 'admin'); })
                ->where('status', 'TELAT')->count();
            $totalAttendancesAllTime = Kehadiran::whereHas('user', function($q) { $q->where('role', '!=', 'admin'); })
                ->count();
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
                
                $present = Kehadiran::whereDate('created_at', $date)
                    ->whereHas('user', function($q) { $q->where('role', '!=', 'admin'); })
                    ->where('status', 'HADIR')->count();
                $late = Kehadiran::whereDate('created_at', $date)
                    ->whereHas('user', function($q) { $q->where('role', '!=', 'admin'); })
                    ->where('status', 'TELAT')->count();
                
                $employeesOnThatDay = User::where('role', '!=', 'admin')
                    ->where('created_at', '<=', $date->endOfDay())
                    ->count();
                $absent = max(0, $employeesOnThatDay - ($present + $late));

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
                    ->whereHas('user', function($q) { $q->where('role', '!=', 'admin'); })
                    ->where('status', 'HADIR')->count();
                $late = Kehadiran::whereMonth('created_at', $monthDate->month)
                    ->whereYear('created_at', $monthDate->year)
                    ->whereHas('user', function($q) { $q->where('role', '!=', 'admin'); })
                    ->where('status', 'TELAT')->count();
                
                // Get employees who existed during that month
                $employeesInMonth = User::where('role', '!=', 'admin')
                    ->where('created_at', '<=', $monthDate->endOfMonth())
                    ->count();
                
                $expectedAttendance = $employeesInMonth * 22; 
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
                $query->where('role', '!=', 'admin');
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
                
                // Better estimation: sum of working days for each user in this company since their creation (capped at start of month)
                $users = User::where('company_id', $company->id)->where('role', '!=', 'admin')->get();
                $expectedCompAttendance = 0;
                foreach ($users as $u) {
                    $userStart = $u->created_at->isAfter($startOfMonth) ? $u->created_at->startOfDay() : $startOfMonth;
                    if ($userStart->isAfter(now())) continue;
                    
                    $userWorkingDays = $userStart->diffInDaysFiltered(function (Carbon $date) {
                        return !$date->isWeekend();
                    }, now());
                    
                    if (!now()->isWeekend()) $userWorkingDays += 1;
                    $expectedCompAttendance += $userWorkingDays;
                }

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
                    ->whereHas('user', function($q) { $q->where('role', '!=', 'admin'); })
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
                    'totalPresent' => Kehadiran::whereDate('created_at', $today)
                        ->whereHas('user', function($q) { $q->where('role', '!=', 'admin'); })
                        ->count(),
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
            $customStart = $request->start_date ? Carbon::parse($request->start_date) : null;
            $customEnd = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

            $startOfWeek = Carbon::now()->startOfWeek();
            $startOfMonth = Carbon::now()->startOfMonth();
            $startOfYear = Carbon::now()->startOfYear();
            
            $getStatsForRange = function($start, $end) use ($targetUserId, $targetUser) {
                // Ensure $start and $end are Carbon instances
                $start = Carbon::parse($start)->startOfDay();
                $end = Carbon::parse($end)->endOfDay();

                // Rule: Only count since account creation
                $actualStart = $targetUser->created_at->isAfter($start) ? $targetUser->created_at->startOfDay() : $start;
                
                $workingDays = $actualStart->diffInDaysFiltered(function (Carbon $date) {
                    return !$date->isWeekend();
                }, $end);
                
                // If today is a weekday and within range, include it
                if (!now()->isWeekend() && now()->between($actualStart, $end)) {
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

                // Hitung total jam telat (dalam menit)
                $totalLateMinutes = 0;
                if ($stats->telat_count > 0) {
                    $lateAttendances = Kehadiran::where('user_id', $targetUserId)
                        ->whereBetween('created_at', [$start, $end])
                        ->where('status', 'TELAT')
                        ->get();

                    foreach ($lateAttendances as $attendance) {
                        try {
                            $checkIn = Carbon::parse($attendance->check_in_time);
                            $office = Company::where('name', $attendance->office_name)->first();
                            if (!$office) {
                                $office = User::find($targetUserId)->company;
                            }
                            
                            if ($office && $office->time_late) {
                                $lateThreshold = Carbon::parse($office->time_late);
                                if ($checkIn > $lateThreshold) {
                                    $totalLateMinutes += $checkIn->diffInMinutes($lateThreshold);
                                }
                            }
                        } catch (\Exception $e) {
                            continue;
                        }
                    }
                }

                return [
                    'hadir' => (int)$stats->hadir_count,
                    'telat' => (int)$stats->telat_count,
                    'absen' => (int)max(0, $workingDays - $totalAttended),
                    'attendanceRate' => $attendanceRate,
                    'lateRate' => $lateRate,
                    'absenceRate' => $absenceRate,
                    'totalWorkingDays' => $workingDays,
                    'total_telat_menit' => $totalLateMinutes,
                    'total_telat_format' => $totalLateMinutes > 0 ? 
                        (floor($totalLateMinutes / 60) > 0 ? floor($totalLateMinutes / 60) . " jam " : "") . ($totalLateMinutes % 60) . " menit" 
                        : "0 menit"
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
                    'status' => $status ? $status->status : ($date->startOfDay()->lt($targetUser->created_at->startOfDay()) ? 'BELUM BERGABUNG' : 'ABSEN'),
                    'present' => ($status && $status->status === 'HADIR') ? 1 : 0,
                    'late' => ($status && $status->status === 'TELAT') ? 1 : 0,
                    'absent' => (!$status && !$date->isWeekend() && $date->startOfDay()->gte($targetUser->created_at->startOfDay())) ? 1 : 0
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
                
                // Calculate expected working days in that month since created_at
                $monthStart = $monthDate->copy()->startOfMonth();
                $monthEnd = $monthDate->copy()->endOfMonth();
                
                // Effective start is the later of monthStart or user creation
                $effectiveStart = $targetUser->created_at->isAfter($monthStart) ? $targetUser->created_at->startOfDay() : $monthStart;
                
                $expectedAttendance = 0;
                if ($effectiveStart->lte($monthEnd)) {
                    // Use 22 as a base if it's a full month in the past, or calculate if it's the current month/creation month
                    if ($effectiveStart->equalTo($monthStart) && $monthEnd->lt(now()->startOfMonth())) {
                        $expectedAttendance = 22;
                    } else {
                        // Calculate working days in the range
                        $tempDate = $effectiveStart->copy();
                        $targetEnd = $monthEnd->lt(now()) ? $monthEnd : now();
                        while ($tempDate->lte($targetEnd)) {
                            if (!$tempDate->isWeekend()) {
                                $expectedAttendance++;
                            }
                            $tempDate->addDay();
                        }
                    }
                }

                $absent = max(0, $expectedAttendance - ($present + $late));

                $sixMonthTrend[] = [
                    'month' => $monthName,
                    'present' => $present,
                    'late' => $late,
                    'absent' => $absent,
                    'expected' => $expectedAttendance
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
                'customStats' => $customStart ? $getStatsForRange($customStart, $customEnd) : null,
                'timeframeStats' => $timeframeStats,
                'weeklyTrend' => $weeklyTrend,
                'sixMonthTrend' => $sixMonthTrend
            ]);

        } catch (\Exception $e) {
            \Log::error('User report summary error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal mengambil data laporan user'], 500);
        }
    }

    public function getEmployeesSummary(Request $request)
    {
        try {
            $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
            $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now();

            $workingDaysInRange = $startDate->diffInDaysFiltered(function (Carbon $date) {
                return !$date->isWeekend();
            }, $endDate);

            // If endDate is today and today is a weekday, include it if it's not already counted correctly by lib
            // Carbon's diffInDaysFiltered might need +1 depending on inclusion of start/end
            // Let's use a more robust way:
            $workingDaysInRange = 0;
            $tempDate = $startDate->copy();
            while ($tempDate->lte($endDate)) {
                if (!$tempDate->isWeekend()) {
                    $workingDaysInRange++;
                }
                $tempDate->addDay();
            }

            $summaries = User::whereIn('role', ['karyawan', 'magang'])
                ->with(['company']) // Eager load company for time_late
                ->leftJoin('attendances', function($join) use ($startDate, $endDate) {
                    $join->on('users.id', '=', 'attendances.user_id')
                         ->whereBetween('attendances.created_at', [$startDate, $endDate]);
                })
                ->select(
                    'users.id',
                    'users.name',
                    'users.role',
                    'users.company_id',
                    'users.created_at',
                    DB::raw("COUNT(CASE WHEN attendances.status = 'HADIR' THEN 1 END) as hadir"),
                    DB::raw("COUNT(CASE WHEN attendances.status = 'TELAT' THEN 1 END) as telat")
                )
                ->groupBy('users.id', 'users.name', 'users.role', 'users.company_id', 'users.created_at')
                ->get();

            $result = $summaries->map(function($item) use ($workingDaysInRange, $startDate, $endDate) {
                $totalAttended = $item->hadir + $item->telat;

                // Hitung total jam telat (dalam menit)
                $totalLateMinutes = 0;
                if ($item->telat > 0) {
                    $lateAttendances = Kehadiran::where('user_id', $item->id)
                        ->whereBetween('created_at', [$startDate, $endDate])
                        ->where('status', 'TELAT')
                        ->get();

                    foreach ($lateAttendances as $attendance) {
                        try {
                            $checkIn = Carbon::parse($attendance->check_in_time);
                            $office = Company::where('name', $attendance->office_name)->first();
                            if (!$office) {
                                $office = $item->company;
                            }
                            
                            if ($office && $office->time_late) {
                                $lateThreshold = Carbon::parse($office->time_late);
                                if ($checkIn > $lateThreshold) {
                                    $totalLateMinutes += $checkIn->diffInMinutes($lateThreshold);
                                }
                            }
                        } catch (\Exception $e) {
                            continue;
                        }
                    }
                }

                // Format total jam telat
                $formattedLate = "0 menit";
                if ($totalLateMinutes > 0) {
                    $hours = floor($totalLateMinutes / 60);
                    $mins = $totalLateMinutes % 60;
                    $parts = [];
                    if ($hours > 0) $parts[] = $hours . " jam";
                    if ($mins > 0) $parts[] = $mins . " menit";
                    $formattedLate = implode(" ", $parts);
                }

                // Rule: Only count since account creation
                $actualStart = $item->created_at->isAfter($startDate) ? $item->created_at->startOfDay() : $startDate;
                $userWorkingDaysInRange = 0;
                if ($actualStart->lte($endDate)) {
                    $tempDate = $actualStart->copy();
                    while ($tempDate->lte($endDate)) {
                        if (!$tempDate->isWeekend()) {
                            $userWorkingDaysInRange++;
                        }
                        $tempDate->addDay();
                    }
                }

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'role' => ucfirst($item->role),
                    'hadir' => (int)$item->hadir,
                    'telat' => (int)$item->telat,
                    'absen' => (int)max(0, $userWorkingDaysInRange - $totalAttended),
                    'total_telat_menit' => $totalLateMinutes,
                    'total_telat_format' => $formattedLate,
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
