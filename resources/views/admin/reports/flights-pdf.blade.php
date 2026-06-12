<!doctype html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Report Penerbangan</title>
    <style>
        @page { margin: 28px 22px 32px 22px; }
        * { font-family: DejaVu Sans, sans-serif; box-sizing: border-box; }
        body { font-size: 9px; color: #1f2937; }

        h1 { font-size: 18px; margin: 0 0 2px; color: #111827; }
        h2 { font-size: 12px; margin: 0 0 8px; color: #374151; letter-spacing: 0.06em; text-transform: uppercase; }
        h3 { font-size: 10px; margin: 0 0 6px; color: #4b5563; letter-spacing: 0.04em; text-transform: uppercase; }
        .muted { color: #6b7280; }

        /* Header */
        .head {
            border-bottom: 3px solid #ec4899;
            padding-bottom: 8px;
            margin-bottom: 12px;
            position: relative;
        }
        .head .title-row { width: 100%; }
        .head .title-row td { vertical-align: top; padding: 0; }
        .head .pill {
            display: inline-block; padding: 2px 8px; border-radius: 999px;
            font-size: 8px; font-weight: 700; letter-spacing: 0.08em;
            background: #fce7f3; color: #9d174d; text-transform: uppercase;
        }
        .head .right { text-align: right; font-size: 9px; color: #6b7280; }

        /* KPI grid */
        .kpi-row { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin-bottom: 12px; }
        .kpi { padding: 8px 10px; border-radius: 6px; border: 1px solid #e5e7eb; background: #fafafa; width: 25%; }
        .kpi .label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; font-weight: 700; }
        .kpi .value { font-size: 18px; font-weight: 800; color: #111827; line-height: 1.1; margin-top: 3px; }
        .kpi .sub { font-size: 8px; color: #6b7280; margin-top: 2px; }
        .kpi.indigo { background: #eef2ff; border-color: #c7d2fe; }
        .kpi.indigo .value { color: #3730a3; }
        .kpi.emerald { background: #ecfdf5; border-color: #a7f3d0; }
        .kpi.emerald .value { color: #065f46; }
        .kpi.yellow { background: #fffbeb; border-color: #fde68a; }
        .kpi.yellow .value { color: #92400e; }
        .kpi.red { background: #fef2f2; border-color: #fecaca; }
        .kpi.red .value { color: #991b1b; }
        .kpi.purple { background: #faf5ff; border-color: #e9d5ff; }
        .kpi.purple .value { color: #6b21a8; }
        .kpi.pink { background: #fdf2f8; border-color: #fbcfe8; }
        .kpi.pink .value { color: #9d174d; }

        /* Two column layout for charts */
        .grid { width: 100%; border-collapse: separate; border-spacing: 6px 0; }
        .grid td { vertical-align: top; padding: 0; }
        .panel {
            border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px;
            background: #ffffff;
        }

        /* Donut legend */
        .legend { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9px; }
        .legend td { padding: 3px 0; vertical-align: middle; }
        .legend .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px; vertical-align: middle; margin-right: 6px; }
        .legend .num { text-align: right; font-weight: 700; color: #111827; }
        .legend .pct { text-align: right; color: #6b7280; }

        /* Hourly bar chart */
        .bar-chart { width: 100%; border-collapse: collapse; margin-top: 6px; }
        .bar-chart td { padding: 1px 0; font-size: 8px; vertical-align: middle; }
        .bar-chart .h-label { width: 30px; text-align: right; padding-right: 6px; color: #6b7280; font-family: monospace; }
        .bar-chart .h-track { background: #f3f4f6; border-radius: 2px; position: relative; height: 9px; }
        .bar-chart .h-fill { background: linear-gradient(90deg, #ec4899, #a855f7); height: 9px; border-radius: 2px; }
        .bar-chart .h-num { width: 20px; text-align: right; padding-left: 5px; color: #374151; font-weight: 700; }

        /* Ranking lists */
        .rank { width: 100%; border-collapse: collapse; font-size: 9px; }
        .rank td { padding: 4px 0; border-bottom: 1px dashed #f3f4f6; vertical-align: middle; }
        .rank .pos { width: 16px; color: #9ca3af; font-weight: 700; font-family: monospace; }
        .rank .name { color: #1f2937; }
        .rank .bar { padding: 0 6px; }
        .rank .bar-track { background: #f3f4f6; border-radius: 2px; height: 6px; }
        .rank .bar-fill { background: linear-gradient(90deg, #6366f1, #ec4899); height: 6px; border-radius: 2px; }
        .rank .num { width: 28px; text-align: right; font-weight: 700; color: #111827; }

        /* Insights */
        .insight-box {
            background: linear-gradient(90deg, #fdf2f8 0%, #f5f3ff 100%);
            border: 1px solid #fbcfe8;
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 12px;
        }
        .insight-box ul { margin: 4px 0 0 14px; padding: 0; }
        .insight-box li { margin: 3px 0; font-size: 9px; line-height: 1.45; color: #374151; }
        .insight-box .head-line { font-size: 9px; color: #9d174d; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }

        /* Detail table */
        table.flights { width: 100%; border-collapse: collapse; margin-top: 6px; }
        table.flights th, table.flights td { padding: 5px 6px; border-bottom: 1px solid #f1f5f9; text-align: left; font-size: 8.5px; }
        table.flights thead th { background: #1f2937; color: #f9fafb; font-size: 8px; text-transform: uppercase; letter-spacing: 0.04em; padding: 6px; }
        table.flights tbody tr:nth-child(even) td { background: #fafafa; }

        .pill-stat { display: inline-block; padding: 2px 6px; border-radius: 999px; font-size: 8px; font-weight: 700; }
        .pill-on { background: #d1fae5; color: #065f46; }
        .pill-delay { background: #fef3c7; color: #92400e; }
        .pill-cancel { background: #fee2e2; color: #991b1b; }
        .pill-default { background: #dbeafe; color: #1e40af; }
        .pill-board { background: #f3e8ff; color: #6b21a8; }

        .section-title-row { margin-top: 12px; padding: 6px 10px; background: #1f2937; color: #fff; border-radius: 4px; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; }

        .footer { position: fixed; bottom: -10px; left: 0; right: 0; text-align: center; font-size: 8px; color: #9ca3af; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>

@php
    $modeLabel = $mode === 'departure' ? 'Keberangkatan' : 'Kedatangan';
    $a = $analytics;

    // Donut: build SVG paths for top status buckets (max 6 slices)
    $palette = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#a855f7', '#06b6d4', '#64748b'];
    $statusList = $a['status_buckets']->take(6);
    $totalForDonut = $statusList->sum() ?: 1;

    $cumulative = 0;
    $slices = [];
    $i = 0;
    foreach ($statusList as $statusName => $count) {
        $pct = $count / $totalForDonut;
        $startAngle = $cumulative * 360;
        $endAngle = ($cumulative + $pct) * 360;
        $cumulative += $pct;
        $slices[] = [
            'name' => $statusName,
            'count' => $count,
            'pct' => $pct,
            'color' => $palette[$i % count($palette)],
            'startAngle' => $startAngle,
            'endAngle' => $endAngle,
        ];
        $i++;
    }

    // Helper for SVG arc
    $polarToCart = function ($cx, $cy, $r, $angleDeg) {
        $rad = ($angleDeg - 90) * M_PI / 180;
        return [$cx + $r * cos($rad), $cy + $r * sin($rad)];
    };

    $cx = 70; $cy = 70; $rOut = 60; $rIn = 36;

    $hourlyMax = max(max($a['hourly'] ?? [1]), 1);
    $topAirlinesMax = $a['top_airlines']->isNotEmpty() ? max($a['top_airlines']->values()->all()) : 1;
    $topPlacesMax = $a['top_places']->isNotEmpty() ? max($a['top_places']->values()->all()) : 1;
@endphp

<!-- HEADER -->
<div class="head">
    <table class="title-row"><tr>
        <td>
            <span class="pill">FIDS Operations Report</span>
            <h1>Report {{ $modeLabel }}</h1>
            <div class="muted">Periode <strong>{{ $start->format('d M Y') }}</strong> &mdash; <strong>{{ $end->format('d M Y') }}</strong> ({{ $start->diffInDays($end) + 1 }} hari)</div>
        </td>
        <td class="right">
            <div>Dibuat: {{ $generatedAt->format('d M Y, H:i') }}</div>
            <div>Zona waktu: <strong>{{ $tz }}</strong></div>
            <div>Total data: <strong>{{ $a['total'] }}</strong> penerbangan</div>
        </td>
    </tr></table>
</div>

<!-- KPI ROW -->
<table class="kpi-row"><tr>
    <td class="kpi indigo">
        <div class="label">Total Penerbangan</div>
        <div class="value">{{ $a['total'] }}</div>
        <div class="sub">Termasuk semua status</div>
    </td>
    <td class="kpi emerald">
        <div class="label">On-Time</div>
        <div class="value">{{ $a['on_time'] }}</div>
        <div class="sub">Tingkat ketepatan {{ $a['performance_rate'] }}%</div>
    </td>
    <td class="kpi yellow">
        <div class="label">Delayed</div>
        <div class="value">{{ $a['delayed'] }}</div>
        <div class="sub">{{ $a['delay_rate'] }}% &middot; rata² {{ $a['avg_delay'] }} mnt</div>
    </td>
    <td class="kpi red">
        <div class="label">Cancelled</div>
        <div class="value">{{ $a['cancelled'] }}</div>
        <div class="sub">{{ $a['cancel_rate'] }}% dari total</div>
    </td>
</tr></table>

<!-- INSIGHTS -->
@if (!empty($a['insights']))
<div class="insight-box">
    <div class="head-line">Insight Otomatis</div>
    <ul>
        @foreach ($a['insights'] as $line)
            <li>{{ $line }}</li>
        @endforeach
    </ul>
</div>
@endif

<!-- ROW: STATUS DONUT + HOURLY BAR -->
<table class="grid">
<tr>
    <td style="width: 38%;">
        <div class="panel">
            <h3>Distribusi Status</h3>
            @if ($a['total'] > 0)
                <table style="width:100%;"><tr>
                    <td style="width: 145px; vertical-align: middle;">
                        <svg width="140" height="140" viewBox="0 0 140 140">
                            @foreach ($slices as $s)
                                @php
                                    $a1 = $polarToCart($cx, $cy, $rOut, $s['startAngle']);
                                    $a2 = $polarToCart($cx, $cy, $rOut, $s['endAngle']);
                                    $a3 = $polarToCart($cx, $cy, $rIn, $s['endAngle']);
                                    $a4 = $polarToCart($cx, $cy, $rIn, $s['startAngle']);
                                    $largeArc = ($s['endAngle'] - $s['startAngle']) > 180 ? 1 : 0;
                                    if (count($slices) === 1) {
                                        $d = 'M ' . ($cx - $rOut) . ' ' . $cy
                                           . ' a ' . $rOut . ' ' . $rOut . ' 0 1 0 ' . (2 * $rOut) . ' 0'
                                           . ' a ' . $rOut . ' ' . $rOut . ' 0 1 0 ' . (-2 * $rOut) . ' 0 Z'
                                           . ' M ' . ($cx - $rIn) . ' ' . $cy
                                           . ' a ' . $rIn . ' ' . $rIn . ' 0 1 1 ' . (2 * $rIn) . ' 0'
                                           . ' a ' . $rIn . ' ' . $rIn . ' 0 1 1 ' . (-2 * $rIn) . ' 0 Z';
                                    } else {
                                        $d = sprintf(
                                            'M %.2f %.2f A %d %d 0 %d 1 %.2f %.2f L %.2f %.2f A %d %d 0 %d 0 %.2f %.2f Z',
                                            $a1[0], $a1[1], $rOut, $rOut, $largeArc, $a2[0], $a2[1],
                                            $a3[0], $a3[1], $rIn, $rIn, $largeArc, $a4[0], $a4[1]
                                        );
                                    }
                                @endphp
                                <path d="{{ $d }}" fill="{{ $s['color'] }}" fill-rule="evenodd" />
                            @endforeach
                            <text x="{{ $cx }}" y="{{ $cy - 4 }}" text-anchor="middle" font-size="20" font-weight="bold" fill="#111827">{{ $a['total'] }}</text>
                            <text x="{{ $cx }}" y="{{ $cy + 12 }}" text-anchor="middle" font-size="8" fill="#6b7280">FLIGHTS</text>
                        </svg>
                    </td>
                    <td style="vertical-align: middle; padding-left: 8px;">
                        <table class="legend">
                            @foreach ($slices as $s)
                                <tr>
                                    <td><span class="swatch" style="background: {{ $s['color'] }};"></span>{{ $s['name'] }}</td>
                                    <td class="num">{{ $s['count'] }}</td>
                                    <td class="pct">{{ number_format($s['pct'] * 100, 1) }}%</td>
                                </tr>
                            @endforeach
                        </table>
                    </td>
                </tr></table>
            @else
                <p class="muted" style="font-size: 9px;">Tidak ada data untuk ditampilkan.</p>
            @endif
        </div>
    </td>

    <td style="width: 62%;">
        <div class="panel">
            <h3>Distribusi Per Jam &middot; Peak: {{ $a['peak_count'] > 0 ? str_pad($a['peak_hour'], 2, '0', STR_PAD_LEFT) . ':00 (' . $a['peak_count'] . ')' : '—' }}</h3>
            @if ($a['total'] > 0)
                <table class="bar-chart">
                    @foreach ($a['hourly'] as $hour => $count)
                        @php
                            $w = $count > 0 ? max(1, round(($count / $hourlyMax) * 100, 1)) : 0;
                            $isPeak = $hour === $a['peak_hour'] && $count > 0;
                        @endphp
                        <tr>
                            <td class="h-label">{{ str_pad($hour, 2, '0', STR_PAD_LEFT) }}:00</td>
                            <td>
                                <div class="h-track">
                                    @if ($w > 0)
                                        <div class="h-fill" style="width: {{ $w }}%; {{ $isPeak ? 'background: linear-gradient(90deg, #f43f5e, #ec4899);' : '' }}"></div>
                                    @endif
                                </div>
                            </td>
                            <td class="h-num">{{ $count }}</td>
                        </tr>
                    @endforeach
                </table>
            @else
                <p class="muted" style="font-size: 9px;">Tidak ada data untuk ditampilkan.</p>
            @endif
        </div>
    </td>
</tr>
</table>

<!-- ROW: TOP AIRLINES + TOP PLACES -->
<table class="grid" style="margin-top: 6px;">
<tr>
    <td style="width: 50%;">
        <div class="panel">
            <h3>Top 5 Maskapai</h3>
            @if ($a['top_airlines']->isNotEmpty())
                <table class="rank">
                    @php $idx = 1; @endphp
                    @foreach ($a['top_airlines'] as $name => $count)
                        @php $w = $count > 0 ? max(2, round(($count / $topAirlinesMax) * 100, 1)) : 0; @endphp
                        <tr>
                            <td class="pos">#{{ $idx++ }}</td>
                            <td class="name" style="width: 38%;">{{ $name }}</td>
                            <td class="bar">
                                <div class="bar-track"><div class="bar-fill" style="width: {{ $w }}%;"></div></div>
                            </td>
                            <td class="num">{{ $count }}</td>
                        </tr>
                    @endforeach
                </table>
            @else
                <p class="muted">Tidak ada data.</p>
            @endif
        </div>
    </td>
    <td style="width: 50%;">
        <div class="panel">
            <h3>Top 5 {{ $mode === 'departure' ? 'Tujuan' : 'Asal' }}</h3>
            @if ($a['top_places']->isNotEmpty())
                <table class="rank">
                    @php $idx = 1; @endphp
                    @foreach ($a['top_places'] as $name => $count)
                        @php $w = $count > 0 ? max(2, round(($count / $topPlacesMax) * 100, 1)) : 0; @endphp
                        <tr>
                            <td class="pos">#{{ $idx++ }}</td>
                            <td class="name" style="width: 38%;">{{ $name }}</td>
                            <td class="bar">
                                <div class="bar-track"><div class="bar-fill" style="width: {{ $w }}%;"></div></div>
                            </td>
                            <td class="num">{{ $count }}</td>
                        </tr>
                    @endforeach
                </table>
            @else
                <p class="muted">Tidak ada data.</p>
            @endif
        </div>
    </td>
</tr>
</table>

<!-- DETAIL TABLE — start on new page so charts stay clean -->
<div class="page-break"></div>
<div class="section-title-row">Daftar Detail Penerbangan {{ $modeLabel }}</div>

<table class="flights">
    <thead>
        <tr>
            <th>Tanggal</th>
            <th>Jadwal</th>
            <th>Estimasi</th>
            <th>Aktual</th>
            <th>Penerbangan</th>
            <th>Maskapai</th>
            <th>{{ $mode === 'departure' ? 'Tujuan' : 'Asal' }}</th>
            <th>{{ $mode === 'departure' ? 'Gate' : 'Belt' }}</th>
            <th>Status</th>
            <th>Catatan</th>
        </tr>
    </thead>
    <tbody>
        @forelse ($flights as $f)
            @php
                $ap = $mode === 'departure' ? $f->airportTujuan : $f->airportAsal;
                $place = $mode === 'departure' ? optional($f->gate)->kode_gate : optional($f->baggageClaim)->nomor_belt;
                $statusClass = match($f->status) {
                    'Departed', 'Arrived', 'Landed' => 'pill-on',
                    'Delayed' => 'pill-delay',
                    'Cancelled' => 'pill-cancel',
                    'Boarding', 'Final Call', 'Gate Open', 'Check-in Open' => 'pill-board',
                    default => 'pill-default',
                };
            @endphp
            <tr>
                <td>{{ \Illuminate\Support\Carbon::parse($f->tanggal_penerbangan)->format('d M Y') }}</td>
                <td>{{ substr($f->jam_jadwal, 0, 5) ?: '-' }}</td>
                <td>{{ substr($f->jam_estimasi ?? '', 0, 5) ?: '-' }}</td>
                <td>{{ substr($f->jam_aktual ?? '', 0, 5) ?: '-' }}</td>
                <td><strong>{{ $f->nomor_penerbangan }}</strong></td>
                <td>{{ optional($f->airline)->nama_maskapai ?? '-' }}</td>
                <td>{{ optional($ap)->kode_iata ?? '---' }} <span class="muted">{{ optional($ap)->kota }}</span></td>
                <td>{{ $place ?? '-' }}</td>
                <td><span class="pill-stat {{ $statusClass }}">{{ $f->status }}</span></td>
                <td class="muted">{{ $f->catatan }}</td>
            </tr>
        @empty
            <tr><td colspan="10" style="text-align:center; padding:30px; color:#9ca3af;">Tidak ada data dalam rentang tanggal ini.</td></tr>
        @endforelse
    </tbody>
</table>

<div class="footer">FIDS Operations Report &middot; {{ $generatedAt->format('d M Y, H:i') }} &middot; {{ $tz }}</div>

</body>
</html>
