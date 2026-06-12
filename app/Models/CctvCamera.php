<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CctvCamera extends Model
{
    protected $fillable = [
        'nama',
        'lokasi',
        'grup',
        'baggage_claim_id',
        'jenis_stream',
        'url_stream',
        'aktif',
        'urutan',
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'urutan' => 'integer',
        'baggage_claim_id' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('aktif', true);
    }

    public function scopeOfGroup($query, string $grup)
    {
        return $query->where('grup', $grup);
    }

    public function baggageClaim()
    {
        return $this->belongsTo(BaggageClaim::class);
    }
}
