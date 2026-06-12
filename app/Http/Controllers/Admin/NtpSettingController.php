<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NtpSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NtpSettingController extends Controller
{
    public function index()
    {
        $setting = NtpSetting::first();

        if (!$setting) {
            $setting = NtpSetting::create([
                'ntp_server_1' => 'id.pool.ntp.org',
                'ntp_server_2' => 'ntp.bmkg.go.id',
                'ntp_server_3' => 'time.google.com',
                'sync_interval' => 3600,
                'auto_sync' => true,
            ]);
        }

        return Inertia::render('Admin/NtpSettings/Index', [
            'setting' => $setting,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'ntp_server_1' => 'required|string|max:255',
            'ntp_server_2' => 'nullable|string|max:255',
            'ntp_server_3' => 'nullable|string|max:255',
            'sync_interval' => 'required|integer|min:60|max:86400',
            'auto_sync' => 'boolean',
        ]);

        $setting = NtpSetting::first() ?? new NtpSetting();
        $setting->fill($validated);
        $setting->save();

        return redirect()->back()->with('success', 'Pengaturan NTP Server berhasil disimpan.');
    }

    public function sync(Request $request)
    {
        $setting = NtpSetting::first();

        if (!$setting) {
            return redirect()->back()->with('error', 'Pengaturan NTP belum dikonfigurasi.');
        }

        $servers = array_filter([
            $setting->ntp_server_1,
            $setting->ntp_server_2,
            $setting->ntp_server_3,
        ]);

        $result = null;
        $serverUsed = null;

        foreach ($servers as $server) {
            $result = $this->queryNtpServer($server);
            if ($result['success']) {
                $serverUsed = $server;
                break;
            }
        }

        // Update history
        $history = $setting->sync_history ?? [];
        $historyEntry = [
            'timestamp' => now()->toIso8601String(),
            'server' => $serverUsed ?? $servers[0] ?? 'unknown',
            'status' => $result['success'] ? 'success' : 'failed',
            'offset_ms' => $result['offset_ms'] ?? null,
            'delay_ms' => $result['delay_ms'] ?? null,
            'error' => $result['error'] ?? null,
        ];

        array_unshift($history, $historyEntry);
        $history = array_slice($history, 0, 20); // Keep last 20 entries

        $setting->update([
            'last_sync_at' => now(),
            'last_sync_status' => $result['success'] ? 'success' : 'failed',
            'last_offset_ms' => $result['offset_ms'] ?? null,
            'last_delay_ms' => $result['delay_ms'] ?? null,
            'last_server_used' => $serverUsed,
            'last_error' => $result['error'] ?? null,
            'sync_history' => $history,
        ]);

        if ($result['success']) {
            return redirect()->back()->with('success', "Sinkronisasi berhasil dari server {$serverUsed}. Offset: {$result['offset_ms']}ms");
        }

        return redirect()->back()->with('error', 'Sinkronisasi gagal: ' . ($result['error'] ?? 'Semua server tidak merespon.'));
    }

    /**
     * Query NTP server using socket connection (SNTP protocol).
     */
    private function queryNtpServer(string $server, int $timeout = 5): array
    {
        try {
            $socket = @fsockopen("udp://{$server}", 123, $errno, $errstr, $timeout);

            if (!$socket) {
                return [
                    'success' => false,
                    'error' => "Tidak dapat terhubung ke {$server}: {$errstr}",
                    'offset_ms' => null,
                    'delay_ms' => null,
                ];
            }

            stream_set_timeout($socket, $timeout);

            // NTP request packet (48 bytes)
            // LI=0, VN=3, Mode=3 (client), rest zeros
            $request = "\x1b" . str_repeat("\0", 47);

            $t1 = microtime(true);
            fwrite($socket, $request);
            $response = fread($socket, 48);
            $t4 = microtime(true);

            fclose($socket);

            if (strlen($response) < 48) {
                return [
                    'success' => false,
                    'error' => "Respons tidak valid dari {$server} (ukuran: " . strlen($response) . " byte)",
                    'offset_ms' => null,
                    'delay_ms' => null,
                ];
            }

            // Parse NTP response
            $data = unpack('N12', $response);

            // Transmit timestamp is at offset 40-47 (words 10-11 in our unpack)
            $transmitSeconds = $data[11] - 2208988800; // Convert from NTP epoch to Unix
            $transmitFraction = $data[12] / 4294967296;
            $t3 = $transmitSeconds + $transmitFraction;

            // Receive timestamp at offset 32-39 (words 8-9)
            $receiveSeconds = $data[9] - 2208988800;
            $receiveFraction = $data[10] / 4294967296;
            $t2 = $receiveSeconds + $receiveFraction;

            // Calculate offset and delay
            $offset = (($t2 - $t1) + ($t3 - $t4)) / 2;
            $delay = ($t4 - $t1) - ($t3 - $t2);

            $offsetMs = round($offset * 1000, 3);
            $delayMs = round($delay * 1000, 3);

            return [
                'success' => true,
                'offset_ms' => $offsetMs,
                'delay_ms' => $delayMs,
                'error' => null,
                'server_time' => date('Y-m-d H:i:s', (int) $t3),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => "Exception: " . $e->getMessage(),
                'offset_ms' => null,
                'delay_ms' => null,
            ];
        }
    }
}
