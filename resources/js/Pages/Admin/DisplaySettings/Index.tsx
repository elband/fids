import { useState } from 'react';
import { useForm, Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface DisplaySetting {
    id: number;
    nama_bandara: string;
    logo_bandara: string | null;
    background_header: string | null;
    tema_warna: string;
    interval_refresh: number;
    kecepatan_scroll: number;
    teks_ticker: string | null;
    lokasi_google_maps: string | null;
    kode_bmkg: string | null;
    bahasa: 'id' | 'en';
    timezone: string | null;
    bagasi_durasi_status_menit?: number | null;
    bagasi_kamera_mulai_menit?: number | null;
    bagasi_kamera_selesai_menit?: number | null;
    board_hide_after_menit?: number | null;
    auto_reload_jam?: number | null;
}

const TIMEZONE_OPTIONS = [
    { value: 'Asia/Jakarta', label: 'WIB — Asia/Jakarta (UTC+7)' },
    { value: 'Asia/Pontianak', label: 'WIB — Asia/Pontianak (UTC+7)' },
    { value: 'Asia/Makassar', label: 'WITA — Asia/Makassar (UTC+8)' },
    { value: 'Asia/Jayapura', label: 'WIT — Asia/Jayapura (UTC+9)' },
    { value: 'UTC', label: 'UTC (UTC+0)' },
];

export default function Index({ auth, setting }: PageProps<{ setting: DisplaySetting | null }>) {
    const { data, setData, post, processing, errors } = useForm({
        nama_bandara: setting?.nama_bandara || '',
        logo_bandara: null as File | null,
        background_header: null as File | null,
        tema_warna: setting?.tema_warna || 'dark',
        interval_refresh: setting?.interval_refresh || 15,
        kecepatan_scroll: setting?.kecepatan_scroll || 1,
        teks_ticker: setting?.teks_ticker || '',
        lokasi_google_maps: setting?.lokasi_google_maps || '',
        kode_bmkg: setting?.kode_bmkg || '',
        bahasa: setting?.bahasa || 'id',
        timezone: setting?.timezone || 'Asia/Makassar',
        bagasi_durasi_status_menit: setting?.bagasi_durasi_status_menit ?? 30,
        bagasi_kamera_mulai_menit: setting?.bagasi_kamera_mulai_menit ?? 10,
        bagasi_kamera_selesai_menit: setting?.bagasi_kamera_selesai_menit ?? 20,
        board_hide_after_menit: setting?.board_hide_after_menit ?? 180,
        auto_reload_jam: setting?.auto_reload_jam ?? 6,
        _method: 'POST',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.display-settings.update'), {
            preserveScroll: true,
        });
    };

    const [reloadState, setReloadState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const forceReloadAll = () => {
        if (!window.confirm('Segarkan SEMUA layar TV monitor sekarang?\n\nSetiap monitor akan memuat ulang tampilan dalam beberapa detik.')) return;
        router.post(route('admin.display-settings.force-reload'), {}, {
            preserveScroll: true,
            onStart: () => setReloadState('sending'),
            onSuccess: () => {
                setReloadState('sent');
                window.setTimeout(() => setReloadState('idle'), 8000);
            },
            onError: () => setReloadState('idle'),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Pengaturan Layar FIDS</h2>}
        >
            <Head title="Pengaturan Layar" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Pengaturan Tampilan Utama</h3>
                            <p className="text-sm text-gray-600 mb-6">Sesuaikan logo, latar belakang header, dan pengaturan lainnya untuk monitor FIDS.</p>

                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="logo_bandara" value="Logo Bandara" />
                                    {setting?.logo_bandara && (
                                        <div className="mb-2 mt-2">
                                            <img src={'/storage/' + setting.logo_bandara} alt="Logo Bandara" className="h-20 object-contain" />
                                        </div>
                                    )}
                                    <input
                                        id="logo_bandara"
                                        type="file"
                                        accept="image/*"
                                        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        onChange={(e) => setData('logo_bandara', e.target.files ? e.target.files[0] : null)}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Format PNG/SVG dengan background transparan direkomendasikan. Maks 2MB.</p>
                                    <InputError message={errors.logo_bandara} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="nama_bandara" value="Nama Bandara" />
                                    <TextInput
                                        id="nama_bandara"
                                        className="mt-1 block w-full"
                                        value={data.nama_bandara}
                                        onChange={(e: any) => setData('nama_bandara', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.nama_bandara} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="kecepatan_scroll" value="Kecepatan Auto-Scroll FIDS (1 = Lambat, 10 = Sangat Cepat)" />
                                    <div className="flex items-center gap-4 mt-1">
                                        <input
                                            id="kecepatan_scroll"
                                            type="range"
                                            min="1"
                                            max="10"
                                            step="1"
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            value={data.kecepatan_scroll}
                                            onChange={(e) => setData('kecepatan_scroll', parseInt(e.target.value))}
                                        />
                                        <span className="font-bold text-gray-700 text-lg w-8 text-center">{data.kecepatan_scroll}</span>
                                    </div>
                                    <InputError message={errors.kecepatan_scroll} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="background_header" value="Background Header FIDS (Opsional)" />
                                    {setting?.background_header && (
                                        <div className="mb-2 mt-2">
                                            <img src={'/storage/' + setting.background_header} alt="Background" className="h-32 object-cover rounded-md border border-gray-200" />
                                        </div>
                                    )}
                                    <input
                                        id="background_header"
                                        type="file"
                                        accept="image/*"
                                        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        onChange={(e: any) => setData('background_header', e.target.files ? e.target.files[0] : null)}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Gambar landscape beresolusi tinggi direkomendasikan.</p>
                                    <InputError message={errors.background_header} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="teks_ticker" value="Teks Ticker / Running Text (Footer)" />
                                    <textarea
                                        id="teks_ticker"
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        rows={3}
                                        value={data.teks_ticker}
                                        onChange={(e) => setData('teks_ticker', e.target.value)}
                                        placeholder="Contoh: Selamat datang di Bandara APT Pranoto • Harap siapkan identitas dan boarding pass Anda • Jangan tinggalkan bagasi tanpa pengawasan"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Gunakan tanda • untuk memisahkan antar kalimat. Teks ini akan berjalan di bagian bawah semua layar monitor.</p>
                                    <InputError message={errors.teks_ticker} className="mt-2" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="lokasi_google_maps" value="Lokasi Bandara (Google Maps URL/Iframe)" />
                                        <TextInput
                                            id="lokasi_google_maps"
                                            className="mt-1 block w-full"
                                            value={data.lokasi_google_maps}
                                            onChange={(e: any) => setData('lokasi_google_maps', e.target.value)}
                                            placeholder="https://maps.google.com/..."
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Gunakan link berbagi atau koordinat dari Google Maps.</p>
                                        <InputError message={errors.lokasi_google_maps} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="kode_bmkg" value="Kode Wilayah BMKG (ADM4)" />
                                        <TextInput
                                            id="kode_bmkg"
                                            className="mt-1 block w-full"
                                            value={data.kode_bmkg}
                                            onChange={(e: any) => setData('kode_bmkg', e.target.value)}
                                            placeholder="64.72.09.1004"
                                        />
                                        <div className="mt-1 p-3 bg-blue-50 rounded-md border border-blue-200">
                                            <p className="text-xs text-blue-700 font-medium">
                                                <strong>Cara Mencari Kode BMKG:</strong><br />
                                                1. Buka <a href="https://api.bmkg.go.id/publik/prakiraan-cuaca" target="_blank" className="underline hover:text-blue-900">API BMKG</a>.<br />
                                                2. Cari nama wilayah bandara Anda (misal: Samarinda).<br />
                                                3. Ambil kode "adm4" yang muncul (contoh: 64.72.09.1004).
                                            </p>
                                        </div>
                                        <InputError message={errors.kode_bmkg} className="mt-2" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel value="Bahasa Layar Publik" />
                                        <div className="mt-2 flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setData('bahasa', 'id')}
                                                className={`px-4 py-2 rounded-md border text-sm font-semibold transition ${
                                                    data.bahasa === 'id'
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                Indonesia
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('bahasa', 'en')}
                                                className={`px-4 py-2 rounded-md border text-sm font-semibold transition ${
                                                    data.bahasa === 'en'
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                English
                                            </button>
                                        </div>
                                        <InputError message={errors.bahasa} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="timezone" value="Zona Waktu (Sumber Jam Tampilan)" />
                                        <select
                                            id="timezone"
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            value={data.timezone}
                                            onChange={(e) => setData('timezone', e.target.value)}
                                        >
                                            {TIMEZONE_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <p className="text-sm text-gray-500 mt-1">Zona waktu ini menjadi sumber jam pada dashboard dan layar FIDS.</p>
                                        <InputError message={errors.timezone} className="mt-2" />
                                    </div>
                                </div>

                                {/* Pengaturan Baggage Claim */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-base font-semibold text-gray-800 mb-1">Baggage Claim</h3>
                                    <p className="text-sm text-gray-500 mb-4">Mengatur berapa lama status penerbangan & kamera CCTV tampil di layar baggage claim setelah pesawat tiba.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <InputLabel htmlFor="bagasi_durasi_status_menit" value="Durasi tampil status (menit)" />
                                            <input
                                                id="bagasi_durasi_status_menit"
                                                type="number" min={1} max={240}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                value={data.bagasi_durasi_status_menit}
                                                onChange={(e) => setData('bagasi_durasi_status_menit', parseInt(e.target.value) || 0)}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Teks status penerbangan hilang setelah menit ini.</p>
                                            <InputError message={errors.bagasi_durasi_status_menit} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="bagasi_kamera_mulai_menit" value="Kamera muncul (menit)" />
                                            <input
                                                id="bagasi_kamera_mulai_menit"
                                                type="number" min={0} max={240}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                value={data.bagasi_kamera_mulai_menit}
                                                onChange={(e) => setData('bagasi_kamera_mulai_menit', parseInt(e.target.value) || 0)}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Kamera CCTV belt muncul jadi latar setelah menit ini.</p>
                                            <InputError message={errors.bagasi_kamera_mulai_menit} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="bagasi_kamera_selesai_menit" value="Kamera hilang (menit)" />
                                            <input
                                                id="bagasi_kamera_selesai_menit"
                                                type="number" min={1} max={240}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                value={data.bagasi_kamera_selesai_menit}
                                                onChange={(e) => setData('bagasi_kamera_selesai_menit', parseInt(e.target.value) || 0)}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Kamera CCTV berhenti tampil setelah menit ini.</p>
                                            <InputError message={errors.bagasi_kamera_selesai_menit} className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Pengaturan Papan Keberangkatan & Kedatangan */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-base font-semibold text-gray-800 mb-1">Papan Keberangkatan & Kedatangan</h3>
                                    <p className="text-sm text-gray-500 mb-4">Mengatur berapa lama penerbangan tetap tampil setelah berangkat/tiba, sebelum otomatis hilang dari papan.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <InputLabel htmlFor="board_hide_after_menit" value="Sembunyikan setelah selesai (menit)" />
                                            <input
                                                id="board_hide_after_menit"
                                                type="number" min={0} max={1440}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                value={data.board_hide_after_menit}
                                                onChange={(e) => setData('board_hide_after_menit', parseInt(e.target.value) || 0)}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Penerbangan yang sudah berangkat/tiba hilang setelah menit ini.
                                                {' '}{data.board_hide_after_menit > 0
                                                    ? `≈ ${(data.board_hide_after_menit / 60).toFixed(1).replace(/\.0$/, '')} jam.`
                                                    : 'Isi 0 = tidak pernah disembunyikan (tampil terus).'}
                                            </p>
                                            <InputError message={errors.board_hide_after_menit} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="auto_reload_jam" value="Auto-muat ulang layar (jam)" />
                                            <input
                                                id="auto_reload_jam"
                                                type="number" min={0} max={168}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                value={data.auto_reload_jam}
                                                onChange={(e) => setData('auto_reload_jam', parseInt(e.target.value) || 0)}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Tiap layar memuat ulang penuh secara berkala (jaring pengaman kiosk 24/7).
                                                {' '}{data.auto_reload_jam > 0
                                                    ? `Tiap ${data.auto_reload_jam} jam.`
                                                    : 'Isi 0 = nonaktif (andalkan polling + tombol "Segarkan Semua Layar TV").'}
                                            </p>
                                            <InputError message={errors.auto_reload_jam} className="mt-2" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">
                                        Selain itu, tiap layar otomatis memuat ulang bila koneksi ke server terputus &gt; 5 menit
                                        (pulih sendiri saat server kembali). Data biasa tetap diperbarui tiap 15 detik tanpa reload.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>Simpan Pengaturan</PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Kontrol jarak jauh: segarkan semua layar TV */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mt-6">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Kontrol Layar TV</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Kirim perintah <span className="font-semibold">segarkan (hard refresh)</span> ke seluruh monitor TV sekaligus.
                                Berguna setelah memperbarui tampilan atau bila ada layar yang macet/masih memuat versi lama.
                                Setiap monitor akan memuat ulang otomatis dalam ±10&ndash;15 detik tanpa perlu menyentuh TV-nya.
                            </p>

                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={forceReloadAll}
                                    disabled={reloadState === 'sending'}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500 text-black font-semibold text-sm shadow-sm transition hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    {reloadState === 'sending' ? 'Mengirim…' : 'Segarkan Semua Layar TV'}
                                </button>

                                {reloadState === 'sent' && (
                                    <span className="text-sm font-medium text-green-600">
                                        ✓ Perintah terkirim. Semua layar akan memuat ulang sebentar lagi.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
