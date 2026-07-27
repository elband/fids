import { Lang } from './types';

/**
 * Label dwibahasa layar taksi. Sengaja berupa kamus statis (bukan i18n runtime)
 * agar layar tetap benar saat mode luring — tidak ada berkas terjemahan yang
 * perlu diambil dari jaringan.
 */
const DICT = {
    headerSubtitle: {
        id: 'INFORMASI TRANSPORTASI RESMI BANDARA',
        en: 'OFFICIAL AIRPORT TRANSPORTATION INFORMATION',
    },
    flightPanel: { id: 'JADWAL PENERBANGAN', en: 'FLIGHT SCHEDULE' },
    directionsPanel: { id: 'PETUNJUK ARAH COUNTER TAKSI', en: 'WAY TO THE TAXI COUNTER' },
    counterLabel: { id: 'COUNTER', en: 'COUNTER' },
    noCounters: { id: 'Counter taksi belum diatur', en: 'Taxi counters not configured' },
    videoPanel: { id: 'INFORMASI & PROMOSI', en: 'INFORMATION & PROMOTION' },
    farePanel: { id: 'TARIF TAKSI RESMI', en: 'OFFICIAL TAXI FARE' },
    callToAction: {
        id: 'Silakan menuju Counter Taksi Resmi Bandara',
        en: 'Please proceed to the Official Airport Taxi Counter',
    },
    scanQr: { id: 'Pindai untuk lokasi', en: 'Scan for location' },
    walkDistance: { id: 'Jarak', en: 'Distance' },
    walkTime: { id: 'Estimasi jalan kaki', en: 'Walking time' },
    minutes: { id: 'menit', en: 'min' },
    destination: { id: 'Tujuan', en: 'Destination' },
    fare: { id: 'Tarif', en: 'Fare' },
    vehicle: { id: 'Kendaraan', en: 'Vehicle' },
    newFare: { id: 'BARU', en: 'NEW' },
    online: { id: 'ONLINE', en: 'ONLINE' },
    updating: { id: 'DATA SEDANG DIPERBARUI', en: 'UPDATING DATA' },
    noFlights: { id: 'Tidak ada jadwal penerbangan', en: 'No flight schedule' },
    noFares: { id: 'Tarif belum tersedia', en: 'Fare not available yet' },
    noVideos: { id: 'Belum ada video', en: 'No video yet' },
    noDirections: { id: 'Petunjuk arah belum diatur', en: 'Directions not configured' },
    flight: { id: 'PENERBANGAN', en: 'FLIGHT' },
    airline: { id: 'MASKAPAI', en: 'AIRLINE' },
    fromTo: { id: 'ASAL / TUJUAN', en: 'ORIGIN / DESTINATION' },
    sched: { id: 'JADWAL', en: 'SCHEDULED' },
    est: { id: 'ESTIMASI', en: 'ESTIMATED' },
    gate: { id: 'GATE', en: 'GATE' },
    status: { id: 'STATUS', en: 'STATUS' },
    arrivalTag: { id: 'TIBA', en: 'ARR' },
    departureTag: { id: 'BERANGKAT', en: 'DEP' },
    emergencyDefault: { id: 'PENGUMUMAN PENTING', en: 'IMPORTANT ANNOUNCEMENT' },
} as const;

export type LabelKey = keyof typeof DICT;

export function t(key: LabelKey, lang: Lang): string {
    return DICT[key][lang];
}

/** Ambil versi bahasa Inggris bila tersedia, jika kosong pakai versi Indonesia. */
export function pick(id: string | null | undefined, en: string | null | undefined, lang: Lang): string {
    if (lang === 'en' && en) return en;
    return id ?? '';
}

/**
 * Sebagian panah (mis. ↘ U+2198) punya varian emoji dan akan dirender sebagai
 * ikon berwarna. Variation Selector-15 memaksa presentasi teks agar bentuknya
 * konsisten dengan panah lain di layar.
 */
export function textArrow(arrow: string): string {
    return `${arrow}︎`;
}

export function formatRupiah(value: number): string {
    return 'Rp ' + value.toLocaleString('id-ID');
}
