/**
 * Hitungan cuaca untuk layar AMC.
 *
 * Dipisah dari komponen supaya bisa diuji tanpa merender halaman — terutama
 * komponen angin, yang salah tandanya tidak akan kelihatan dari tampilan.
 */

/** BMKG mengirim kecepatan angin dalam km/jam; penerbangan memakai knot. */
export const KMH_PER_KNOT = 1.852;

export function kmhToKnots(kmh: number): number {
    return kmh / KMH_PER_KNOT;
}

const COMPASS_16 = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

const COMPASS_16_ID: Record<string, string> = {
    N: 'UTARA', NNE: 'UTARA TIMUR LAUT', NE: 'TIMUR LAUT', ENE: 'TIMUR TIMUR LAUT',
    E: 'TIMUR', ESE: 'TIMUR MENENGGARA', SE: 'TENGGARA', SSE: 'SELATAN MENENGGARA',
    S: 'SELATAN', SSW: 'SELATAN BARAT DAYA', SW: 'BARAT DAYA', WSW: 'BARAT BARAT DAYA',
    W: 'BARAT', WNW: 'BARAT BARAT LAUT', NW: 'BARAT LAUT', NNW: 'UTARA BARAT LAUT',
};

export function normalizeDegrees(deg: number): number {
    return ((deg % 360) + 360) % 360;
}

/**
 * Label 16 penjuru dihitung sendiri dari derajat, bukan memakai field `wd`
 * BMKG: `wd` hanya 8 penjuru dan pembulatannya kasar (pernah terlihat
 * wd="E" untuk wd_deg=128, yang sebenarnya tenggara), sehingga panah kompas
 * akan menunjuk arah yang berbeda dari tulisannya.
 */
export function compassPoint(deg: number): string {
    return COMPASS_16[Math.round(normalizeDegrees(deg) / 22.5) % 16];
}

export function compassLabel(deg: number, lang: 'id' | 'en'): string {
    const point = compassPoint(deg);
    return lang === 'id' ? (COMPASS_16_ID[point] ?? point) : point;
}

export interface WindComponents {
    /** Positif = headwind, negatif = tailwind. Satuan mengikuti input. */
    head: number;
    /** Selalu positif; arah datangnya ada di `from`. */
    cross: number;
    /** Sisi datangnya crosswind dilihat dari kokpit saat lepas landas. */
    from: 'left' | 'right';
}

/**
 * Komponen angin terhadap runway.
 *
 * `windFromDeg` adalah arah DATANG angin (konvensi BMKG `wd_deg` dan juga
 * konvensi penerbangan), `runwayHeading` arah hidung pesawat saat lepas landas.
 * Selisih 0° berarti angin tepat dari depan → headwind penuh.
 */
export function windComponents(windFromDeg: number, windSpeed: number, runwayHeading: number): WindComponents {
    const angle = ((normalizeDegrees(windFromDeg) - normalizeDegrees(runwayHeading)) * Math.PI) / 180;
    const cross = windSpeed * Math.sin(angle);
    return {
        head: windSpeed * Math.cos(angle),
        cross: Math.abs(cross),
        // sin > 0 berarti angin datang dari sisi kanan hidung pesawat.
        from: cross >= 0 ? 'right' : 'left',
    };
}

export type VisibilityLevel = 'good' | 'moderate' | 'poor';

/**
 * Ambang mengikuti kebiasaan operasional: di bawah 1 km kondisi buruk,
 * 1-5 km perlu perhatian, di atas itu aman.
 */
export function visibilityLevel(meters: number): VisibilityLevel {
    if (meters < 1000) return 'poor';
    if (meters < 5000) return 'moderate';
    return 'good';
}

export function formatVisibility(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    const km = meters / 1000;
    return `${km >= 10 ? Math.round(km) : km.toFixed(1)} km`;
}

export type DataFreshness = 'fresh' | 'stale' | 'expired';

/**
 * Umur data. Scheduler menjalankan fids:fetch-weather tiap 30 menit, jadi
 * lewat 45 menit berarti ada yang tidak beres dan lewat 90 menit angkanya
 * tidak layak lagi dipajang tanpa peringatan.
 */
export function dataFreshness(ageMinutes: number): DataFreshness {
    if (ageMinutes > 90) return 'expired';
    if (ageMinutes > 45) return 'stale';
    return 'fresh';
}

export function minutesSince(iso: string | null | undefined, now: Date): number | null {
    if (!iso) return null;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    return Math.max(0, Math.floor((now.getTime() - then) / 60000));
}

/**
 * Jarak pandang METAR ditulis seperti situs BMKG: "2,1 km", "800 m", dan
 * 9999 (disimpan sebagai 10000) menjadi "≥ 10 km".
 */
export function formatMetarVisibility(meters: number, lang: 'id' | 'en'): string {
    if (meters >= 10000) return '≥ 10 km';
    if (meters < 1000) return `${Math.round(meters)} m`;
    const km = meters / 1000;
    const text = Number.isInteger(km) ? String(km) : km.toFixed(1);
    return `${lang === 'id' ? text.replace('.', ',') : text} km`;
}

const METAR_WEATHER_ID: Record<string, string> = {
    DZ: 'Gerimis', RA: 'Hujan', SN: 'Salju', GR: 'Hujan es', GS: 'Hujan es kecil',
    BR: 'Kabut tipis', FG: 'Kabut', FU: 'Asap', VA: 'Abu vulkanik', DU: 'Debu', SA: 'Pasir',
    HZ: 'Udara kabur', SQ: 'Angin kencang (squall)', FC: 'Puting beliung', TS: 'Badai petir',
};

const METAR_WEATHER_EN: Record<string, string> = {
    DZ: 'Drizzle', RA: 'Rain', SN: 'Snow', GR: 'Hail', GS: 'Small hail',
    BR: 'Mist', FG: 'Fog', FU: 'Smoke', VA: 'Volcanic ash', DU: 'Dust', SA: 'Sand',
    HZ: 'Haze', SQ: 'Squall', FC: 'Funnel cloud', TS: 'Thunderstorm',
};

/** Terjemahan singkat grup cuaca METAR (mis. "-TSRA FU") untuk layar. */
export function describeMetarWeather(code: string | null, lang: 'id' | 'en'): string | null {
    if (!code) return null;
    const dict = lang === 'id' ? METAR_WEATHER_ID : METAR_WEATHER_EN;
    const parts = code.split(' ').map((group) => {
        if (group === 'NSW') return lang === 'id' ? 'Tanpa cuaca signifikan' : 'No significant weather';
        const intensity = group.startsWith('-') ? (lang === 'id' ? ' ringan' : 'Light ')
            : group.startsWith('+') ? (lang === 'id' ? ' lebat' : 'Heavy ') : '';
        const body = group.replace(/^[-+]|^VC/, '');
        const words = (body.match(/.{2}/g) ?? [])
            .filter((c) => c !== 'SH' || body === 'SH')
            .map((c) => dict[c])
            .filter(Boolean);
        if (words.length === 0) return group;
        const text = words.join(lang === 'id' ? ' & ' : ' & ');
        return lang === 'id' ? `${text}${intensity}` : `${intensity}${text}`;
    });
    return parts.join(', ');
}

/** Tutupan awan METAR terendah yang bermakna, mis. "FEW025" → "Sedikit awan 2.500 ft". */
export function describeMetarClouds(clouds: string | null, lang: 'id' | 'en'): string | null {
    if (!clouds) return null;
    const first = clouds.split(' ')[0];
    if (first === 'CAVOK') return 'CAVOK';
    if (['NSC', 'NCD', 'SKC', 'CLR'].includes(first)) return lang === 'id' ? 'Tanpa awan signifikan' : 'No significant cloud';
    const vv = first.match(/^VV(\d{3})$/);
    if (vv) return `${lang === 'id' ? 'Langit tertutup, VV' : 'Sky obscured, VV'} ${Number(vv[1]) * 100} ft`;
    const m = first.match(/^(FEW|SCT|BKN|OVC)(\d{3})/);
    if (!m) return first;
    const names = lang === 'id'
        ? { FEW: 'Sedikit awan', SCT: 'Awan tersebar', BKN: 'Awan terputus', OVC: 'Tertutup awan' }
        : { FEW: 'Few clouds', SCT: 'Scattered', BKN: 'Broken', OVC: 'Overcast' };
    const ft = (Number(m[2]) * 100).toLocaleString(lang === 'id' ? 'id-ID' : 'en-GB');
    return `${names[m[1] as keyof typeof names]} ${ft} ft`;
}
