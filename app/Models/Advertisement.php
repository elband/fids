<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Advertisement extends Model
{
    protected $fillable = [
        'title',
        'media_path',
        'media_type',
        'duration',
        'status',
        'order_index',
    ];
}
