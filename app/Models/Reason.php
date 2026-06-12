<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reason extends Model
{
    protected $fillable = ['kode', 'deskripsi', 'kategori', 'status_aktif'];

    protected $casts = [
        'status_aktif' => 'boolean',
    ];
}
