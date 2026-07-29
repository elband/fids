<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Public Address System (PAS)
    |--------------------------------------------------------------------------
    |
    | Pengumuman otomatis (mode "Automatic" dari perubahan status penerbangan)
    | hanya berupa baris DB; yang memutarnya adalah pemutar. Ada dua jenis:
    |
    |  1. Pemutar browser  — layar publik & panel admin (selalu aktif).
    |  2. Pemutar server   — perangkat speaker yang tercolok ke mesin server,
    |                        dijalankan command `fids:play-announcements`.
    |
    | Pemutar server DEFAULT MATI. Menyalakannya saat browser juga memutar
    | membuat satu pengumuman terhitung dua kali (broadcast_count naik 2 per
    | siklus). Nyalakan hanya bila speaker memang terhubung ke server.
    |
    */

    'pas' => [
        'server_speaker' => env('FIDS_PAS_SERVER_SPEAKER', false),

        // Hanya pengumuman dengan target ini yang diputar oleh server.
        // Kosongkan (null) untuk memutar semua target.
        'server_speaker_targets' => ['Server Speakers'],
    ],

];
