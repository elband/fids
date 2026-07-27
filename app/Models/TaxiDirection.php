<?php

namespace App\Models;

use App\Models\Concerns\BustsTaxiCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class TaxiDirection extends Model
{
    use BustsTaxiCache;

    protected $fillable = [
        'judul', 'judul_en', 'deskripsi', 'deskripsi_en',
        'gambar_path', 'denah_path', 'qr_path', 'qr_url',
        'jarak_meter', 'estimasi_menit', 'is_active', 'order_index',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'jarak_meter' => 'integer',
        'estimasi_menit' => 'integer',
        'order_index' => 'integer',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
