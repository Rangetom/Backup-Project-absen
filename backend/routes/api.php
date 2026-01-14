<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\adminController;
use App\Http\Controllers\fotoController;
use App\Http\Controllers\AttendanceSettingController;
use App\Http\Controllers\AttendanceController;

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Get authenticated user
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

/*
|--------------------------------------------------------------------------
| ADMIN - USER CRUD
|--------------------------------------------------------------------------
*/
Route::get('/users', [adminController::class, 'index']);
Route::post('/users', [adminController::class, 'store']);
Route::put('/users/{id}', [adminController::class, 'update']);
Route::delete('/users/{id}', [adminController::class, 'destroy']);

Route::apiResource('companies', \App\Http\Controllers\CompanyController::class);

/*
|--------------------------------------------------------------------------
| EMPLOYEE - ATTENDANCE
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/attendance/checkin', [fotoController::class, 'checkIn']);
    Route::get('/attendance/today', [AttendanceController::class, 'getTodayAttendance']);
    Route::get('/attendance/monthly-stats', [AttendanceController::class, 'getMonthlyStats']);
});



// routes/api.php (tambahkan route ini)

Route::get('/attendances', [AttendanceController::class, 'index']);
Route::get('/reports/summary', [\App\Http\Controllers\ReportController::class, 'getSummary']);