<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gate extends Model
{
    protected $fillable = ['kode_gate', 'nama_gate', 'terminal', 'status_gate', 'petunjuk_arah'];

    public function flights()
    {
        return $this->hasMany(Flight::class);
    }
}
