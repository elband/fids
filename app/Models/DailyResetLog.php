<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyResetLog extends Model
{
    protected $fillable = ['tanggal_reset', 'total_penerbangan_diarsipkan', 'status', 'catatan', 'executed_at'];

    protected $casts = [
        'tanggal_reset' => 'date',
        'executed_at' => 'datetime',
    ];
}
