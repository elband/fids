<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class AudioService
{
    /**
     * Speak text using server-side TTS (Windows or Linux).
     */
    /**
     * Speak text using server-side TTS (Windows or Linux).
     * Supports bilingual text separated by '---'
     */
    public function speak(string $text, int $repeat = 1, int $intervalSeconds = 150): void
    {
        $segments = explode('---', $text);
        $audioFiles = [];
        
        // Ensure directory exists
        $path = storage_path('app/public/audio');
        if (!file_exists($path)) mkdir($path, 0777, true);

        foreach ($segments as $index => $segment) {
            $cleanSegment = trim($segment);
            if ($cleanSegment === '') continue;

            $lang = ($index === 0) ? 'id' : 'en';
            $filename = md5($cleanSegment . $lang) . '.mp3';
            $filePath = $path . '/' . $filename;

            // Download if not exists (Cache). file_get_contents TIDAK melempar
            // exception saat jaringan mati — ia hanya memunculkan warning dan
            // mengembalikan false, sehingga catch di bawah tak pernah jalan dan
            // pemutar menerima berkas kosong (senyap total). Kini kegagalan
            // dideteksi lewat nilai kembalian, lalu jatuh ke TTS lokal.
            if (!file_exists($filePath) || filesize($filePath) === 0) {
                if (!$this->downloadTts($cleanSegment, $lang, $filePath)) {
                    $this->speakLocal($text, $repeat, $intervalSeconds);
                    return;
                }
            }
            $audioFiles[] = $filePath;
        }

        if ($audioFiles === []) return;

        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows Play Script
            $psScript = "Add-Type -AssemblyName PresentationCore; " .
                        "for(\$i=0; \$i -lt {$repeat}; \$i++){ ";
            foreach ($audioFiles as $file) {
                $psScript .= "\$p = New-Object System.Windows.Media.MediaPlayer; ";
                $psScript .= "\$p.Open('" . str_replace('/', '\\', $file) . "'); ";
                $psScript .= "\$p.Play(); ";
                // Tunggu durasi termuat, tapi jangan selamanya: bila file rusak/gagal
                // dibuka, HasTimeSpan tak pernah true dan proses menggantung tanpa suara.
                $psScript .= "\$w = 0; while(\$p.NaturalDuration.HasTimeSpan -eq \$false -and \$w -lt 50){ Start-Sleep -m 100; \$w++ }; ";
                // [Math]::Ceiling(...) harus dibungkus \$( ) — tanpa itu PowerShell
                // memperlakukannya sebagai string literal dan Start-Sleep gagal bind
                // ("CannotConvertArgument"), sehingga pengumuman tidak pernah terdengar.
                $psScript .= "if(\$p.NaturalDuration.HasTimeSpan){ Start-Sleep -s \$([Math]::Ceiling(\$p.NaturalDuration.TimeSpan.TotalSeconds + 1)) } else { Start-Sleep -s 10 }; ";
                $psScript .= "\$p.Close(); ";
            }
            $psScript .= "if(\$i -lt " . ($repeat - 1) . "){ Start-Sleep -s {$intervalSeconds} } ";
            $psScript .= "}";
            
            $command = "start /B powershell -WindowStyle Hidden -Command \"{$psScript}\"";
            pclose(popen($command, "r"));
        } else {
            $player = $this->linuxPlayer();

            // Tidak ada pemutar mp3 terpasang: lebih baik suara robotik espeak
            // daripada senyap tanpa jejak.
            if ($player === null) {
                $this->speakLocal($text, $repeat, $intervalSeconds);
                return;
            }

            // Pengulangan di-unroll di PHP, bukan lewat "for i in {1..N}":
            // exec() menjalankan /bin/sh (dash di Debian/Ubuntu) yang TIDAK
            // mengembangkan brace, sehingga loop lama berjalan dengan literal
            // "{1..3}" dan repeat diabaikan diam-diam.
            // Batas waktu keras per berkas. Di VM tanpa sink audio nyata (ALSA
            // dummy), mpg123 tidak pernah selesai memutar: ia berputar di state R
            // memakan ~25% CPU selamanya. Karena scheduler memanggil tiap menit,
            // prosesnya menumpuk sampai seluruh core server habis. Pengumuman TTS
            // hanya beberapa detik, jadi 30 detik sudah sangat longgar.
            $guard = $this->timeoutPrefix();

            $script = '';
            for ($i = 0; $i < max(1, $repeat); $i++) {
                foreach ($audioFiles as $file) {
                    $script .= $guard . $player . ' ' . escapeshellarg($file) . '; sleep 0.5; ';
                }
                if ($i < $repeat - 1) {
                    $script .= 'sleep ' . (int) $intervalSeconds . '; ';
                }
            }

            // Jendela kunci: total durasi maksimum skrip di atas, plus kelonggaran.
            $ttl = (max(1, $repeat) * count($audioFiles) * self::PLAYER_TIMEOUT_SEC)
                 + (max(0, $repeat - 1) * (int) $intervalSeconds) + 10;

            $this->runDetached($script, $ttl);
        }
    }

    /**
     * Unduh TTS Google ke berkas. Mengembalikan false bila jaringan mati atau
     * balasan kosong, supaya pemanggil bisa jatuh ke TTS lokal.
     */
    private function downloadTts(string $text, string $lang, string $destination): bool
    {
        $url = "https://translate.google.com/translate_tts?ie=UTF-8&q=" . urlencode($text) . "&tl={$lang}&client=tw-ob";

        // User-Agent wajib: tanpa itu Google membalas 404 untuk sebagian jaringan.
        $context = stream_context_create(['http' => [
            'timeout' => 10,
            'header'  => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n",
        ]]);

        try {
            $content = @file_get_contents($url, false, $context);
        } catch (\Throwable $e) {
            return false;
        }

        if (!is_string($content) || $content === '') return false;

        return (bool) @file_put_contents($destination, $content);
    }

    /**
     * Pemutar mp3 pertama yang tersedia di sistem, atau null bila tak satu pun ada.
     */
    private function linuxPlayer(): ?string
    {
        $candidates = [
            'mpg123' => 'mpg123 -q',
            'ffplay' => 'ffplay -nodisp -autoexit -loglevel quiet',
            'mpv'    => 'mpv --no-video --really-quiet',
            'cvlc'   => 'cvlc --play-and-exit --intf dummy',
        ];

        foreach ($candidates as $binary => $command) {
            if (shell_exec("command -v {$binary} 2>/dev/null")) return $command;
        }

        return null;
    }

    /** Batas waktu satu kali pemutaran berkas audio (detik). */
    private const PLAYER_TIMEOUT_SEC = 30;

    /**
     * Awalan `timeout` bila tersedia (coreutils, standar di Debian/Ubuntu).
     * -k mengirim KILL bila pemutar mengabaikan TERM.
     */
    private function timeoutPrefix(): string
    {
        static $prefix = null;
        if ($prefix !== null) {
            return $prefix;
        }

        $prefix = shell_exec('command -v timeout 2>/dev/null')
            ? 'timeout -k 5 ' . self::PLAYER_TIMEOUT_SEC . ' '
            : '';

        return $prefix;
    }

    /**
     * Jalankan skrip shell di latar belakang tanpa menahan request/command PHP.
     *
     * Satu pemutar pada satu waktu. exec() di bawah bersifat fire-and-forget:
     * ia kembali seketika, jadi `withoutOverlapping` pada scheduler TIDAK
     * melindungi apa pun — command PHP-nya memang sudah selesai. Tanpa kunci
     * ini, tiap menit menambah satu proses pemutar baru di atas yang lama.
     */
    private function runDetached(string $script, int $ttlSeconds = 120): void
    {
        // Kunci dilepas oleh kedaluwarsa, bukan oleh kita: prosesnya terlepas
        // sehingga tidak ada yang tersisa untuk melepaskannya secara eksplisit.
        if (! Cache::add(self::PLAYER_LOCK_KEY, 1, max(10, $ttlSeconds))) {
            return;
        }

        exec('nohup sh -c ' . escapeshellarg($script) . ' > /dev/null 2>&1 &');
    }

    /** Penanda "sedang ada pemutar berjalan" di cache. */
    private const PLAYER_LOCK_KEY = 'fids:pas:player-busy';

    /**
     * Returns list of missing system dependencies required for Linux TTS playback.
     */
    public function getMissingDependencies(): array
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            return [];
        }

        $missing = [];
        // Jalur utama memutar mp3 hasil TTS Google; tanpa pemutar ini pengumuman
        // senyap total walau espeak terpasang.
        if ($this->linuxPlayer() === null)     $missing[] = 'mpg123';
        if (!shell_exec('command -v espeak')) $missing[] = 'espeak';
        if (!shell_exec('command -v aplay'))  $missing[] = 'alsa-utils (aplay)';

        return $missing;
    }

    /**
     * Fallback to local robotic TTS if internet is down.
     */
    private function speakLocal(string $text, int $repeat, int $intervalSeconds): void
    {
        $segments = explode('---', $text);
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $psScript = "Add-Type -AssemblyName System.Speech; \$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; for(\$i=0; \$i -lt {$repeat}; \$i++){ ";
            foreach ($segments as $index => $segment) {
                $lang = ($index === 0) ? 'id-ID' : 'en-US';
                $psScript .= "\$s.SelectVoiceByHints(0, 0, 0, [System.Globalization.CultureInfo]::GetCultureInfo('{$lang}')); \$s.Speak('" . str_replace("'", "", $segment) . "'); ";
            }
            $psScript .= "if(\$i -lt " . ($repeat - 1) . "){ Start-Sleep -s {$intervalSeconds} } }";
            exec("start /B powershell -WindowStyle Hidden -Command \"{$psScript}\"");
            return;
        }

        // Cabang Linux sebelumnya TIDAK ADA: saat internet mati, fallback ini
        // dipanggil lalu tidak melakukan apa pun, jadi pengumuman hilang tanpa
        // jejak. espeak berbunyi robotik tapi jauh lebih baik daripada senyap.
        if (!shell_exec('command -v espeak 2>/dev/null')) return;

        $script = '';
        for ($i = 0; $i < max(1, $repeat); $i++) {
            foreach ($segments as $index => $segment) {
                $cleanSegment = trim($segment);
                if ($cleanSegment === '') continue;

                $voice = ($index === 0) ? 'id' : 'en';
                // espeak bisa menggantung dengan sebab yang sama seperti mpg123.
                $script .= $this->timeoutPrefix() . 'espeak -v ' . $voice . ' -s 140 ' . escapeshellarg($cleanSegment) . '; sleep 0.5; ';
            }
            if ($i < $repeat - 1) {
                $script .= 'sleep ' . (int) $intervalSeconds . '; ';
            }
        }

        if ($script !== '') {
            $ttl = (max(1, $repeat) * max(1, count($segments)) * self::PLAYER_TIMEOUT_SEC)
                 + (max(0, $repeat - 1) * (int) $intervalSeconds) + 10;
            $this->runDetached($script, $ttl);
        }
    }
}
