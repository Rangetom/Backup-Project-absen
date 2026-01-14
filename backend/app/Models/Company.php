<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'radius_km',
        'time_in',
        'time_late',
        'time_out',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
