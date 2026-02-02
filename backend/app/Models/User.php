<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'employee_code',
        'company_id',
        'allowed_companies',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'allowed_companies' => 'array',
    ];

    // Relation ke attendances
    public function attendances()
    {
        return $this->hasMany(Kehadiran::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}