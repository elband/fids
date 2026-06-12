import { useEffect, useState } from 'react';

/**
 * ScoreNumber — animasi papan skor (rolling digit / split flap).
 * Tiap digit ditampilkan dalam slot gelap dan menggulung ke nilai baru
 * ketika prop `value` berubah.
 */

interface ScoreDigitProps {
    digit: string;
    delayMs?: number;
}

function ScoreDigit({ digit, delayMs = 0 }: ScoreDigitProps) {
    const num = parseInt(digit, 10);
    const isNumeric = !isNaN(num);

    return (
        <span
            className="
                relative inline-block align-middle
                h-[1.25em] w-[0.78em]
                rounded-[0.18em]
                bg-gradient-to-b from-gray-900 to-black
                dark:from-black dark:to-gray-950
                text-white
                shadow-[inset_0_-2px_4px_rgba(255,255,255,0.06),inset_0_2px_4px_rgba(0,0,0,0.6)]
                ring-1 ring-black/40
                overflow-hidden
                tabular-nums font-mono
            "
        >
            {/* garis tengah split-flap */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/70 z-10"
            />

            {isNumeric ? (
                <span
                    className="absolute inset-x-0 top-0 flex flex-col items-center transition-transform duration-700 ease-[cubic-bezier(.32,1.4,.4,1)] will-change-transform"
                    style={{
                        transform: `translateY(-${num * 1.25}em)`,
                        transitionDelay: `${delayMs}ms`,
                    }}
                >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span
                            key={n}
                            className="flex h-[1.25em] w-full items-center justify-center leading-none"
                        >
                            {n}
                        </span>
                    ))}
                </span>
            ) : (
                <span className="absolute inset-0 flex items-center justify-center leading-none">{digit}</span>
            )}
        </span>
    );
}

interface ScoreNumberProps {
    value: number;
    /** Pad ke jumlah digit minimum (mis. 2 ⇒ 03). 0 = tidak pad. */
    minDigits?: number;
    className?: string;
}

export default function ScoreNumber({ value, minDigits = 0, className = '' }: ScoreNumberProps) {
    const safeValue = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    const [shown, setShown] = useState(0);

    useEffect(() => {
        // animasi mount: dari 0 ke nilai target
        const id = requestAnimationFrame(() => setShown(safeValue));
        return () => cancelAnimationFrame(id);
    }, [safeValue]);

    const str = String(shown).padStart(minDigits, '0');
    const digits = str.split('');

    return (
        <span className={`inline-flex items-center gap-[0.08em] leading-none ${className}`}>
            {digits.map((d, i) => (
                <ScoreDigit key={`${digits.length}-${i}`} digit={d} delayMs={i * 60} />
            ))}
        </span>
    );
}
