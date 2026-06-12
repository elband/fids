/**
 * RadarBackdrop — overlay animasi radar (rings + sweep + blips).
 * Letakkan di dalam parent yang `relative overflow-hidden`.
 */
export default function RadarBackdrop({
    size = 420,
    position = 'br',
    blips = [
        { x: '58%', y: '38%', delay: '0.6s', dur: '3.6s' },
        { x: '36%', y: '62%', delay: '2.2s', dur: '4.2s' },
        { x: '70%', y: '58%', delay: '1.4s', dur: '3.2s' },
        { x: '46%', y: '30%', delay: '3.0s', dur: '4.6s' },
    ],
}: {
    size?: number;
    position?: 'br' | 'bl' | 'tr' | 'tl';
    blips?: { x: string; y: string; delay: string; dur: string }[];
}) {
    const offset = -Math.round(size * 0.3);
    const posStyle: React.CSSProperties =
        position === 'br' ? { right: offset, bottom: offset } :
        position === 'bl' ? { left: offset, bottom: offset } :
        position === 'tr' ? { right: offset, top: offset } :
                            { left: offset, top: offset };

    const rings = [size * 0.30, size * 0.50, size * 0.70, size * 0.90];

    return (
        <>
            <style>{`
                @keyframes radar-spin       { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes radar-ring-pulse { 0%,100% { opacity: 0.18; } 50% { opacity: 0.45; } }
                @keyframes radar-blip       { 0%,100% { opacity: 0; transform: scale(0.4); } 40%,60% { opacity: 1; transform: scale(1); } }
            `}</style>
            <div
                className="pointer-events-none absolute"
                style={{ width: size, height: size, ...posStyle }}
                aria-hidden
            >
                {rings.map((d, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full border border-pink-300/30"
                        style={{
                            width: d,
                            height: d,
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%,-50%)',
                            animation: `radar-ring-pulse ${2.4 + i * 0.4}s ease-in-out infinite`,
                            animationDelay: `${i * 0.3}s`,
                        }}
                    />
                ))}
                <div
                    className="absolute"
                    style={{
                        width: size * 0.85,
                        height: size * 0.85,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%,-50%)',
                        background:
                            'conic-gradient(from 0deg, rgba(236,72,153,0.45) 0deg, rgba(236,72,153,0.18) 28deg, transparent 90deg, transparent 360deg)',
                        borderRadius: '9999px',
                        animation: 'radar-spin 4.5s linear infinite',
                        filter: 'blur(2px)',
                    }}
                />
                <div
                    className="absolute h-2 w-2 rounded-full bg-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.9)]"
                    style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                />
                {blips.map((b, i) => (
                    <div
                        key={i}
                        className="absolute h-1.5 w-1.5 rounded-full bg-fuchsia-300 shadow-[0_0_10px_rgba(217,70,239,0.9)]"
                        style={{
                            top: b.y,
                            left: b.x,
                            animation: `radar-blip ${b.dur} ease-in-out infinite`,
                            animationDelay: b.delay,
                        }}
                    />
                ))}
            </div>
        </>
    );
}
