<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Log Penerbangan</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .page-header {
            padding: 20px 0;
            border-bottom: 1px solid #ccc;
            margin-bottom: 20px;
        }
        .title {
            font-size: 24px;
            margin: 0;
            font-weight: bold;
        }
        .subtitle {
            margin: 6px 0 0;
            color: #666;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }
        th,
        td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            vertical-align: top;
            text-align: left;
            font-size: 12px;
        }
        th {
            background-color: #f4f4f4;
            font-weight: 700;
        }
        .small {
            font-size: 11px;
            color: #555;
        }
        .text-center {
            text-align: center;
        }
        .footer {
            margin-top: 20px;
            font-size: 11px;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="page-header">
        <h1 class="title">Log Penerbangan</h1>
        <p class="subtitle">Daftar perubahan status penerbangan hari ini</p>
        <p class="subtitle">Dihasilkan: {{ $generatedAt->format('d F Y H:i:s') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th class="text-center">Waktu</th>
                <th>Penerbangan</th>
                <th>Maskapai</th>
                <th>Status Lama</th>
                <th>Status Baru</th>
                <th>Catatan</th>
                <th class="text-center">Diubah oleh</th>
            </tr>
        </thead>
        <tbody>
            @forelse($flightLogs as $log)
                <tr>
                    <td class="text-center">{{ optional($log->changed_at)->format('H:i:s') ?? '-' }}</td>
                    <td>
                        {{ optional($log->flight)->nomor_penerbangan ?? '-' }}<br>
                        <span class="small">{{ optional($log->flight->airportAsal)->kode_iata ?? '-' }} → {{ optional($log->flight->airportTujuan)->kode_iata ?? '-' }}</span>
                    </td>
                    <td>{{ optional($log->flight->airline)->nama_maskapai ?? optional($log->flight->airline)->nama ?? '-' }}</td>
                    <td>{{ $log->status_lama ?? '-' }}</td>
                    <td>{{ $log->status_baru ?? '-' }}</td>
                    <td>{{ $log->catatan ?? '-' }}</td>
                    <td class="text-center">{{ optional($log->changedBy)->name ?? 'Sistem' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center">Tidak ada log penerbangan untuk hari ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Halaman ini dihasilkan dari sistem FIDS.
    </div>
</body>
</html>
