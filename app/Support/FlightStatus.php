<?php

namespace App\Support;

/**
 * Satu sumber kebenaran untuk kumpulan status penerbangan yang dipakai lintas modul
 * (API layar publik, modul Boarding Gate, Check-in Counter, Baggage Claim).
 *
 * Sebelumnya setiap modul menuliskan daftar `whereIn('status', [...])` sendiri dan
 * daftar itu ikut menyimpang satu per satu: status 'On Time' dan 'Check-in Closed'
 * ada di dropdown admin tetapi tertinggal dari daftar papan gate, sehingga
 * penerbangan LENYAP dari layar gate begitu petugas memilih status tersebut.
 * Semua modul sekarang wajib merujuk konstanta di kelas ini.
 *
 * @see resources/js/Pages/Admin/Departures/Index.tsx — dropdown status petugas
 */
final class FlightStatus
{
    /** Semua status yang dapat dipilih petugas pada dropdown penerbangan harian. */
    public const ALL = [
        'Scheduled', 'On Time', 'Check-in Open', 'Check-in Closed', 'Boarding',
        'Gate Open', 'Final Call', 'Gate Closed', 'Departed', 'Landed', 'Arrived',
        'Baggage Claim', 'Delayed', 'Cancelled',
    ];

    /**
     * Status pra-keberangkatan yang masih "pasif": penerbangan belum melekat ke
     * gate, jadi hanya tampil dalam jendela waktu sebelum jam jadwal.
     */
    public const PASSIVE_DEPARTURE = ['Scheduled', 'On Time', 'Delayed'];

    /**
     * Status yang berarti penerbangan sudah benar-benar melekat ke gate-nya:
     * begitu check-in dibuka, penumpang sudah diarahkan ke gate tersebut, jadi
     * gate harus menampilkannya tanpa menunggu jendela waktu.
     */
    public const GATE_ACTIVE = [
        'Check-in Open', 'Check-in Closed', 'Boarding', 'Gate Open', 'Final Call', 'Gate Closed',
    ];

    /**
     * Status yang berhak tampil di papan/kartu gate — gabungan pasif + aktif,
     * plus 'Departed' (masih tampil sebentar setelah berangkat).
     * 'Cancelled' tidak termasuk: penerbangan batal tidak menempati gate.
     */
    public const GATE_BOARD = [
        'Scheduled', 'On Time', 'Delayed',
        'Check-in Open', 'Check-in Closed', 'Boarding', 'Gate Open', 'Final Call', 'Gate Closed',
        'Departed',
    ];

    /** Status yang berhak tampil di kartu check-in counter pada panel admin. */
    public const CHECKIN_BOARD = ['Scheduled', 'On Time', 'Check-in Open', 'Check-in Closed', 'Delayed'];

    /** Satu-satunya status yang membuat counter tampil "buka" di layar publik. */
    public const CHECKIN_OPEN = 'Check-in Open';

    /**
     * Status yang berarti pesawat sudah tiba (memicu tampil di baggage claim).
     * CATATAN: 'On Time' TIDAK termasuk — itu status pra-kedatangan (sejajar
     * Scheduled/Delayed), bukan pertanda pesawat sudah mendarat.
     */
    public const ARRIVED = ['Arrived', 'Landed', 'Baggage Claim'];

    /** Status yang berhak tampil di kartu belt bagasi pada panel admin. */
    public const BAGGAGE_BOARD = ['Scheduled', 'On Time', 'Landed', 'Arrived', 'Baggage Claim', 'Delayed'];

    /** Status keberangkatan yang dianggap "selesai" untuk papan keberangkatan. */
    public const DEPARTED = ['Departed'];
}
