<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NtpSetting extends Model
{
    protected $fillable = [
        'ntp_server_1',
        'ntp_server_2',
        'ntp_server_3',
        'sync_interval',
        'auto_sync',
        'last_sync_at',
        'last_sync_status',
        'last_offset_ms',
        'last_delay_ms',
        'last_server_used',
        'last_error',
        'sync_history',
    ];

    protected $casts = [
        'auto_sync' => 'boolean',
        'last_sync_at' => 'datetime',
        'last_offset_ms' => 'decimal:3',
        'last_delay_ms' => 'decimal:3',
        'sync_history' => 'array',
    ];
}
