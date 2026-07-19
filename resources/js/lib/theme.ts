/**
 * Utilitas warna tema latar layar TV publik.
 *
 * Sumber warna = DisplaySetting.tema_warna (Pengaturan Layar FIDS). Nilainya
 * berupa hex (mis. "#0f172a") dari color picker, tetapi data lawas bisa berupa
 * nama preset ("navy", "indigo", ...). `normalizeThemeColor` menyatukan keduanya
 * menjadi hex, lalu `themeGradient` menurunkannya jadi gradient latar berkedalaman.
 */

const FALLBACK = '#0f172a';

/** Nama preset lawas → hex (samakan dengan THEME_COLORS di halaman Pengaturan). */
const LEGACY_NAMES: Record<string, string> = {
    navy: '#0f172a',
    indigo: '#1e1b4b',
    hutan: '#052e16',
    forest: '#052e16',
    merah: '#450a0a',
    red: '#450a0a',
    coklat: '#1c1917',
    brown: '#1c1917',
    hitam: '#000000',
    black: '#000000',
    'ungu gelap': '#0c0a25',
    slate: '#0b1320',
};

/** Kembalikan hex 6 digit valid (#rrggbb) dari input apa pun; fallback bila tak dikenal. */
export function normalizeThemeColor(input?: string | null): string {
    if (!input) return FALLBACK;
    const v = input.trim().toLowerCase();

    // #rgb → #rrggbb
    const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
    if (short) {
        return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
    }
    if (/^#[0-9a-f]{6}$/.test(v)) return v;

    return LEGACY_NAMES[v] ?? FALLBACK;
}

function hexToRgb(hex: string): [number, number, number] {
    const h = normalizeThemeColor(hex).slice(1);
    return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
    ];
}

/** Campur warna ke putih (amount>0) atau ke hitam (amount<0). amount ∈ [-1, 1]. */
function shade([r, g, b]: [number, number, number], amount: number): string {
    const target = amount >= 0 ? 255 : 0;
    const t = Math.abs(amount);
    const mix = (c: number) => Math.round(c + (target - c) * t);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/**
 * Gradient latar papan dari satu warna tema. Sedikit lebih terang di kiri-atas
 * dan lebih gelap di kanan-bawah agar tetap berdimensi seperti desain awal.
 */
export function themeGradient(input?: string | null): string {
    const rgb = hexToRgb(normalizeThemeColor(input));
    const top = shade(rgb, 0.1);
    const mid = shade(rgb, -0.08);
    const bottom = shade(rgb, -0.4);
    return `linear-gradient(160deg, ${top} 0%, ${mid} 50%, ${bottom} 100%)`;
}
