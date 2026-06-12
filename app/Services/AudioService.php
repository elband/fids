<?php

namespace App\Services;

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
            $lang = ($index === 0) ? 'id' : 'en';
            $filename = md5($cleanSegment . $lang) . '.mp3';
            $filePath = $path . '/' . $filename;
            
            // Download if not exists (Cache)
            if (!file_exists($filePath)) {
                $url = "https://translate.google.com/translate_tts?ie=UTF-8&q=" . urlencode($cleanSegment) . "&tl={$lang}&client=tw-ob";
                try {
                    $content = file_get_contents($url);
                    if ($content) file_put_contents($filePath, $content);
                } catch (\Exception $e) {
                    // Fallback to local TTS if no internet
                    $this->speakLocal($text, $repeat, $intervalSeconds);
                    return;
                }
            }
            $audioFiles[] = $filePath;
        }

        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows Play Script
            $psScript = "Add-Type -AssemblyName PresentationCore; " .
                        "for(\$i=0; \$i -lt {$repeat}; \$i++){ ";
            foreach ($audioFiles as $file) {
                $psScript .= "\$p = New-Object System.Windows.Media.MediaPlayer; ";
                $psScript .= "\$p.Open('" . str_replace('/', '\\', $file) . "'); ";
                $psScript .= "\$p.Play(); ";
                $psScript .= "Start-Sleep -m 200; while(\$p.NaturalDuration.HasTimeSpan -eq \$false){ Start-Sleep -m 100 }; "; // Wait for load
                $psScript .= "Start-Sleep -s [Math]::Ceiling(\$p.NaturalDuration.TimeSpan.TotalSeconds + 1); ";
                $psScript .= "\$p.Close(); ";
            }
            $psScript .= "if(\$i -lt " . ($repeat - 1) . "){ Start-Sleep -s {$intervalSeconds} } ";
            $psScript .= "}";
            
            $command = "start /B powershell -WindowStyle Hidden -Command \"{$psScript}\"";
            pclose(popen($command, "r"));
        } else {
            // Linux Play Script (requires mpg123 or mplayer)
            $linuxScript = "for i in {1..{$repeat}}; do ";
            foreach ($audioFiles as $file) {
                $linuxScript .= "mpg123 \"{$file}\" || mplayer \"{$file}\" || play \"{$file}\"; ";
                $linuxScript .= "sleep 0.5; ";
            }
            $linuxScript .= "[ \$i -lt {$repeat} ] && sleep {$intervalSeconds}; ";
            $linuxScript .= "done";
            
            exec($linuxScript . " > /dev/null 2>&1 &");
        }
    }

    /**
     * Returns list of missing system dependencies required for Linux TTS playback.
     */
    public function getMissingDependencies(): array
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            return [];
        }

        $missing = [];
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
        }
    }
}
