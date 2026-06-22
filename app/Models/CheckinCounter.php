<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CheckinCounter extends Model
{
    protected $fillable = ['nomor_counter', 'area', 'terminal', 'airline_id', 'status_counter', 'idle_image'];

    public function airline()
    {
        return $this->belongsTo(Airline::class);
    }

    public function flights()
    {
        return $this->belongsToMany(Flight::class, 'flight_checkin_counter');
    }
}
