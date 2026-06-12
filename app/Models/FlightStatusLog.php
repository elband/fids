<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlightStatusLog extends Model
{
    protected $fillable = ['flight_id', 'status_lama', 'status_baru', 'catatan', 'changed_by', 'changed_at'];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function flight()
    {
        return $this->belongsTo(Flight::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
