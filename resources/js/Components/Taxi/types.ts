/** Bentuk payload dari /api/fids/taxi dan props awal Inertia Display/TaxiSignage. */

export interface TaxiSettings {
    judul_layar: string;
    logo_url: string | null;
    background_url: string | null;
    warna_aksen: string;
    tema_warna: 'slate' | 'midnight' | 'teal' | 'plum';
    video_interval_detik: number;
    flight_refresh_detik: number;
    running_text_speed: number;
    scroll_detik_per_layar: number;
    bahasa: 'id' | 'en' | 'auto';
    bahasa_switch_detik: number;
    tampilkan_penerbangan: boolean;
    tampilkan_video: boolean;
    tampilkan_tarif: boolean;
    mode_hemat: boolean;
}

export interface TaxiDirection {
    id: number;
    judul: string;
    judul_en: string | null;
    deskripsi: string | null;
    deskripsi_en: string | null;
    gambar_url: string | null;
    denah_url: string | null;
    qr_url_gambar: string | null;
    qr_url: string | null;
    jarak_meter: number | null;
    estimasi_menit: number | null;
}

export interface TaxiCounter {
    id: number;
    nomor: string;
    nama_operator: string;
    jenis_layanan: string | null;
    arah: string;
}

export interface TaxiFare {
    id: number;
    wilayah: string;
    tujuan: string;
    jenis_kendaraan: string;
    tarif: number;
    tarif_sebelumnya: number | null;
    baru: boolean;
    berlaku_mulai: string | null;
}

export interface TaxiVideo {
    id: number;
    judul: string;
    url: string | null;
    thumbnail_url: string | null;
    durasi_detik: number | null;
}

export interface TaxiRunningTextItem {
    id: number;
    pesan: string;
    pesan_en: string | null;
    warna: string;
}

export interface TaxiFlight {
    id: number;
    nomor_penerbangan: string;
    jenis: 'departure' | 'arrival';
    airline: string | null;
    airline_logo: string | null;
    kota: string | null;
    jam_jadwal: string | null;
    jam_estimasi: string | null;
    gate: string | null;
    status: string | null;
}

export interface TaxiEmergency {
    judul: string;
    pesan: string | null;
    sampai: string | null;
}

export interface TaxiPayload {
    settings: TaxiSettings;
    directions: TaxiDirection[];
    counters: TaxiCounter[];
    fares: TaxiFare[];
    videos: TaxiVideo[];
    running_texts: TaxiRunningTextItem[];
    flights: TaxiFlight[];
    emergency: TaxiEmergency | null;
    server_time: string;
}

export type Lang = 'id' | 'en';
