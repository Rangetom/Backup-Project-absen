<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kehadiran extends Model
{
    use HasFactory;

    protected $table = 'attendances';

    protected $fillable = [
        'user_id',
        'photo',
        'latitude',
        'longitude',
        'check_in_time',
        'status',
        'office_name'
    ];

    // Relation ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}