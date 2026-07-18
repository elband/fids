// Public Address (PAS) helper:
// 1) Plays a warm 2-tone airport chime with harmonics
// 2) Speaks announcement via SpeechSynthesis with natural pacing
// 3) Resolves only when speech ends or errors

let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
    if (sharedAudioCtx && sharedAudioCtx.state !== 'closed') return sharedAudioCtx;
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new Ctx();
    return sharedAudioCtx!;
}

/**
 * Play a warm 2-tone airport chime with harmonics and reverb tail.
 * Sounds like real airport PA system (bing-bong).
 */
export function playAirportChime(volume = 0.4): Promise<void> {
    return new Promise((resolve) => {
        try {
            const ctx = getAudioCtx();
            if (ctx.state === 'suspended') ctx.resume().catch(() => { /* ignore */ });

            const now = ctx.currentTime;

            // Master gain
            const master = ctx.createGain();
            master.gain.value = volume;
            master.connect(ctx.destination);

            // Soft low-pass filter for warmth
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 3000;
            filter.Q.value = 0.7;
            filter.connect(master);

            // Two chime tones: E5 (659.25) → C5 (523.25) — classic airport interval
            const tones: Array<{ freq: number; harmonics: number[]; start: number; dur: number }> = [
                { freq: 659.25, harmonics: [1318.5, 1977.75], start: 0,    dur: 0.7 },
                { freq: 523.25, harmonics: [1046.5, 1569.75], start: 0.55, dur: 1.0 },
            ];

            tones.forEach(({ freq, harmonics, start, dur }) => {
                // Fundamental
                createTone(ctx, filter, freq, 1.0, now + start, dur);
                // Soft harmonics for richness
                harmonics.forEach((h, i) => {
                    createTone(ctx, filter, h, 0.15 / (i + 1), now + start, dur * 0.8);
                });
            });

            // Total duration including reverb tail
            const totalMs = (0.55 + 1.0) * 1000 + 200;
            setTimeout(() => resolve(), totalMs);
        } catch (e) {
            resolve();
        }
    });
}

function createTone(ctx: AudioContext, dest: AudioNode, freq: number, amp: number, startTime: number, dur: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Smooth envelope: soft attack, sustain, long release (natural decay)
    const attack = startTime + 0.02;
    const sustain = startTime + dur * 0.5;
    const release = startTime + dur;

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(amp, attack);
    gain.gain.setValueAtTime(amp * 0.85, sustain);
    gain.gain.exponentialRampToValueAtTime(0.0001, release);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(startTime);
    osc.stop(release + 0.1);
}

/**
 * Eja kode penerbangan agar diartikulasikan satu-per-satu saat diucapkan TTS.
 * Contoh: "GA121" -> "G A 1 2 1", "QG-423" -> "Q G 4 2 3", "ID6257" -> "I D 6 2 5 7".
 * Pola: 2-3 huruf kapital + 1-4 angka (boleh ada strip/spasi & sufiks huruf, mis. "GA12A").
 * Waktu (13:50), gate (A1), dan kata biasa tidak terpengaruh.
 */
function spellOutFlightCodes(text: string): string {
    return text.replace(
        /\b([A-Z]{2,3})[-\s]?(\d{1,4})([A-Z]?)\b/g,
        (_m, letters: string, digits: string, suffix: string) => {
            const parts = [
                ...letters.split(''),
                ...digits.split(''),
                ...(suffix ? suffix.split('') : []),
            ];
            // Pisahkan tiap karakter dengan spasi agar dibaca terpisah (huruf & angka).
            return parts.join(' ');
        },
    );
}

/**
 * Speak text using SpeechSynthesis with natural pacing:
 *  - Slower rate (0.85) for clarity
 *  - Slightly lower pitch for authority
 *  - Chromium long-text fix
 *  - Prefer female Indonesian voice (more natural for PA)
 *  - Add pauses at punctuation for natural rhythm
 */
export function speakText(
    text: string,
    opts: { lang?: string; rate?: number; pitch?: number; volume?: number } = {},
): Promise<void> {
    const { lang = 'id-ID', rate = 0.85, pitch = 0.95, volume = 1.0 } = opts;

    // Pre-process text for more natural speech:
    // - Eja kode penerbangan huruf-demi-huruf & angka-demi-angka
    // - Add slight pauses at commas and periods
    // - Clean up multiple spaces
    const processedText = spellOutFlightCodes(text)
        .replace(/\.\s*/g, '. ... ')      // longer pause at periods
        .replace(/,\s*/g, ', .. ')         // medium pause at commas
        .replace(/\s{2,}/g, ' ')           // clean multiple spaces
        .trim();

    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            return resolve();
        }

        const synth = window.speechSynthesis;

        const start = () => {
            const utter = new SpeechSynthesisUtterance(processedText);
            utter.lang = lang;
            utter.rate = rate;
            utter.pitch = pitch;
            utter.volume = volume;

            // Voice selection: prefer natural/female Indonesian voice
            const voices = synth.getVoices();
            const preferred = selectBestVoice(voices, lang);
            if (preferred) utter.voice = preferred;

            // Chromium bug: speech stops after ~15 seconds. Workaround: tick pause/resume.
            let keepAlive: number | null = window.setInterval(() => {
                if (synth.speaking && !synth.paused) {
                    synth.pause();
                    synth.resume();
                }
            }, 10000);

            // Watchdog: Chromium kadang TIDAK PERNAH memicu onend/onerror, membuat
            // utterance macet — keepAlive bocor selamanya DAN promise tak pernah settle,
            // sehingga di pemanggil isPlayingRef tak pernah reset → seluruh PA mati
            // permanen (audit HIGH). Paksa cleanup + resolve setelah durasi maksimum
            // wajar (perkiraan durasi bicara + margin, dibatasi 120 dtk).
            const maxMs = Math.min(120000, 15000 + processedText.length * 120);
            let watchdog: number | null = window.setTimeout(() => {
                watchdog = null;
                try { synth.cancel(); } catch { /* ignore */ }
                cleanup();
                resolve();
            }, maxMs);

            const cleanup = () => {
                if (keepAlive) {
                    window.clearInterval(keepAlive);
                    keepAlive = null;
                }
                if (watchdog) {
                    window.clearTimeout(watchdog);
                    watchdog = null;
                }
            };

            utter.onend = () => { cleanup(); resolve(); };
            utter.onerror = () => { cleanup(); resolve(); };

            try {
                synth.speak(utter);
            } catch {
                cleanup();
                resolve();
            }
        };

        if (synth.getVoices().length === 0) {
            const handler = () => {
                synth.onvoiceschanged = null;
                start();
            };
            synth.onvoiceschanged = handler;
            setTimeout(() => { if (synth.onvoiceschanged === handler) { synth.onvoiceschanged = null; start(); } }, 1500);
        } else {
            start();
        }
    });
}

/**
 * Select the best voice for natural PA announcement.
 * Priority: Google Indonesian > Microsoft Indonesian > any Indonesian > any matching lang prefix
 */
function selectBestVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
    const langPrefix = lang.split('-')[0].toLowerCase();

    // Priority 1: Google voices (most natural)
    const google = voices.find(v => v.lang === lang && v.name.toLowerCase().includes('google'));
    if (google) return google;

    // Priority 2: Microsoft Online voices (natural)
    const msOnline = voices.find(v => v.lang === lang && v.name.toLowerCase().includes('online'));
    if (msOnline) return msOnline;

    // Priority 3: Any exact lang match
    const exact = voices.find(v => v.lang === lang);
    if (exact) return exact;

    // Priority 4: Prefix match (e.g. 'id' matches 'id-ID')
    const prefix = voices.find(v => v.lang?.toLowerCase().startsWith(langPrefix));
    if (prefix) return prefix;

    return null;
}

/**
 * High-level: chime → pause → speak.
 * The pause between chime and speech makes it sound professional.
 */
export async function announce(text: string, opts?: Parameters<typeof speakText>[1]): Promise<void> {
    await playAirportChime();
    // Professional gap between chime and speech (like real airport PA)
    await new Promise((r) => setTimeout(r, 400));
    await speakText(text, opts);
}
