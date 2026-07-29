/**
 * ScoreChars — teks papan bandara, satu karakter per ubin split-flap.
 *
 * Dipakai bersama papan keberangkatan & kedatangan (sebelumnya dua salinan yang
 * mulai menyimpang: versi kedatangan belum null-safe). Gaya ubin ada di
 * BOARD_CSS (`lib/boardMotion`).
 *
 * `flip` dipakai saat nilainya benar-benar berubah (mis. status penerbangan),
 * bukan saat baris sekadar dirender ulang karena rotasi — ubin jatuh dari engsel
 * atas seperti papan Solari, sehingga perubahan nyata terbaca beda dari gerakan
 * rutin papan.
 */
export default function ScoreChars({
    text,
    baseDelay = 0,
    flip = false,
    step = 40,
}: {
    text?: string | null;
    baseDelay?: number;
    flip?: boolean;
    step?: number;
}) {
    // Field bisa null/undefined dari API (mis. status/waktu kosong) — jangan sampai
    // `.split()` melempar dan menjatuhkan seluruh papan.
    const safeText = text ?? '';

    return (
        <>
            {safeText.split('').map((char, i) => (
                <span key={i} className="score-char">
                    <span
                        className={flip ? 'score-char-flip' : undefined}
                        style={{ animationDelay: `${baseDelay + i * step}ms` }}
                    >
                        {char === ' ' ? ' ' : char}
                    </span>
                </span>
            ))}
        </>
    );
}
