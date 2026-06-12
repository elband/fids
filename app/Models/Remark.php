<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Remark extends Model
{
    protected $fillable = ['kode', 'nama_remark', 'status_aktif'];

    protected $casts = [
        'status_aktif' => 'boolean',
    ];
}
