<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BaggageClaim extends Model
{
    protected $fillable = ['nomor_belt', 'area', 'terminal', 'status_belt'];

    public function flights()
    {
        return $this->hasMany(Flight::class);
    }
}
