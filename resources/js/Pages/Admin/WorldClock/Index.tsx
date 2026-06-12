import { useForm, Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { Clock, Globe, Eye, EyeOff, Palette, Monitor } from 'lucide-react';

interface WorldClockSetting {
    id: number;
    show_utc: boolean;
    show_wib: boolean;
    show_wita: boolean;
    show_wit: boolean;
    format_waktu: '12h' | '24h';
    show_seconds: boolean;
    show_date: boolean;
    tema_warna: string;
    accent_color: string;
    judul_layar: string | null;
    show_nama_bandara: boolean;
    show_analog_clock: boolean;
    show_ntp_status: boolean;
    use_background_image: boolean;
}

const THEME_COLORS = [
    { value: '#0f172a', label: 'Navy' },
    { value: '#1e1b4b', label: 'Indigo' },
    { value: '#052e16', label: 'Hutan' },
    { value: '#000000', label: 'Hitam' },
    { value: '#0c0a25', label: 'Ungu Gelap' },
    { value: '#0b1320', label: 'Slate' },
    { value: '#1a1a2e', label: 'Midnight' },
    { value: '#0a0f1e', label: 'Deep Ocean' },
    { value: '#1c1917', label: 'Coklat Tua' },
    { value: '#0f0f23', label: 'Carbon' },
    { value: '#0d1117', label: 'GitHub Dark' },
    { value: '#1a0000', label: 'Merah Gelap' },
    { value: '#0a192f', label: 'Biru Tua' },
    { value: '#16213e', label: 'Royal' },
    { value: '#0e1a2b', label: 'Petrol' },
    { value: '#1b2838', label: 'Steam' },
    { value: '#2d1b69', label: 'Violet' },
    { value: '#1a0033', label: 'Purple Night' },
    { value: '#001a1a', label: 'Teal Gelap' },
    { value: '#1a1a1a', label: 'Abu Gelap' },
];

const ACCENT_COLORS = [
    { value: '#3b82f6', label: 'Biru' },
    { value: '#10b981', label: 'Hijau' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#ef4444', label: 'Merah' },
    { value: '#8b5cf6', label: 'Ungu' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#ffffff', label: 'Putih' },
    { value: '#14b8a6', label: 'Teal' },
    { value: '#f97316', label: 'Oranye' },
    { value: '#a855f7', label: 'Purple' },
    { value: '#22d3ee', label: 'Sky' },
    { value: '#84cc16', label: 'Lime' },
    { value: '#e11d48', label: 'Rose' },
    { value: '#facc15', label: 'Kuning' },
    { value: '#6366f1', label: 'Indigo' },
    { value: '#2dd4bf', label: 'Mint' },
    { value: '#fb923c', label: 'Peach' },
    { value: '#c084fc', label: 'Lavender' },
    { value: '#38bdf8', label: 'Aqua' },
];

const TIMEZONE_ZONES = [
    { key: 'show_utc', label: 'UTC', desc: 'Coordinated Universal Time (UTC+0)' },
    { key: 'show_wib', label: 'WIB', desc: 'Waktu Indonesia Barat (UTC+7)' },
    { key: 'show_wita', label: 'WITA', desc: 'Waktu Indonesia Tengah (UTC+8)' },
    { key: 'show_wit', label: 'WIT', desc: 'Waktu Indonesia Timur (UTC+9)' },
] as const;

export default function Index({ auth, setting }: PageProps<{ setting: WorldClockSetting }>) {
    const { data, setData, processing, errors } = useForm({
        show_utc: setting.show_utc ?? true,
        show_wib: setting.show_wib ?? true,
        show_wita: setting.show_wita ?? true,
        show_wit: setting.show_wit ?? true,
        format_waktu: setting.format_waktu || '24h',
        show_seconds: setting.show_seconds ?? true,
        show_date: setting.show_date ?? true,
        tema_warna: setting.tema_warna || '#0f172a',
        accent_color: setting.accent_color || '#3b82f6',
        judul_layar: setting.judul_layar || '',
        show_nama_bandara: setting.show_nama_bandara ?? true,
        show_analog_clock: setting.show_analog_clock ?? false,
        show_ntp_status: setting.show_ntp_status ?? true,
        use_background_image: setting.use_background_image ?? false,
        _method: 'POST',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('admin.world-clock-settings.update'), {
            show_utc: data.show_utc ? 1 : 0,
            show_wib: data.show_wib ? 1 : 0,
            show_wita: data.show_wita ? 1 : 0,
            show_wit: data.show_wit ? 1 : 0,
            format_waktu: data.format_waktu,
            show_seconds: data.show_seconds ? 1 : 0,
            show_date: data.show_date ? 1 : 0,
            tema_warna: data.tema_warna,
            accent_color: data.accent_color,
            judul_layar: data.judul_layar || '',
            show_nama_bandara: data.show_nama_bandara ? 1 : 0,
            show_analog_clock: data.show_analog_clock ? 1 : 0,
            show_ntp_status: data.show_ntp_status ? 1 : 0,
            use_background_image: data.use_background_image ? 1 : 0,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 leading-tight">Pengaturan World Clock Display</h2>}
        >
            <Head title="Pengaturan World Clock" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Preview Link */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Monitor size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Preview Layar World Clock</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Buka di tab baru untuk melihat tampilan di TV Monitor</p>
                                </div>
                            </div>
                            <a
                                href="/mclock"
                                target="_blank"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Globe size={16} />
                                Buka Layar Monitor
                            </a>
                        </div>
                    </div>

                    {/* Settings Form */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={submit} className="space-y-8">

                                {/* Zona Waktu yang Ditampilkan */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Globe size={20} className="text-indigo-500" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Zona Waktu yang Ditampilkan</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {TIMEZONE_ZONES.map((zone) => (
                                            <label
                                                key={zone.key}
                                                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                    data[zone.key]
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={data[zone.key]}
                                                    onChange={(e) => setData(zone.key, e.target.checked)}
                                                />
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${data[zone.key] ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                    {data[zone.key] && <Eye size={12} />}
                                                    {!data[zone.key] && <EyeOff size={12} className="text-gray-400" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">{zone.label}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{zone.desc}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Format Waktu */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Clock size={20} className="text-indigo-500" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Format Tampilan</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <InputLabel value="Format Waktu" />
                                            <div className="mt-2 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('format_waktu', '24h')}
                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                                                        data.format_waktu === '24h'
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                                                    }`}
                                                >
                                                    24 Jam
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('format_waktu', '12h')}
                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                                                        data.format_waktu === '12h'
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                                                    }`}
                                                >
                                                    12 Jam (AM/PM)
                                                </button>
                                            </div>
                                            <InputError message={errors.format_waktu} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel value="Tampilkan Detik" />
                                            <div className="mt-3">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={data.show_seconds} onChange={(e) => setData('show_seconds', e.target.checked)} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    <span className="ms-3 text-sm text-gray-700 dark:text-gray-300">{data.show_seconds ? 'Ya' : 'Tidak'}</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel value="Tampilkan Tanggal" />
                                            <div className="mt-3">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={data.show_date} onChange={(e) => setData('show_date', e.target.checked)} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    <span className="ms-3 text-sm text-gray-700 dark:text-gray-300">{data.show_date ? 'Ya' : 'Tidak'}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tema & Warna */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Palette size={20} className="text-indigo-500" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tema & Warna</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel value="Warna Background" />
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {THEME_COLORS.map((c) => (
                                                    <button
                                                        key={c.value}
                                                        type="button"
                                                        onClick={() => setData('tema_warna', c.value)}
                                                        className={`w-10 h-10 rounded-lg border-2 transition-all ${data.tema_warna === c.value ? 'border-indigo-500 scale-110 ring-2 ring-indigo-300' : 'border-gray-300 dark:border-gray-600'}`}
                                                        style={{ backgroundColor: c.value }}
                                                        title={c.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel value="Warna Aksen" />
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {ACCENT_COLORS.map((c) => (
                                                    <button
                                                        key={c.value}
                                                        type="button"
                                                        onClick={() => setData('accent_color', c.value)}
                                                        className={`w-10 h-10 rounded-lg border-2 transition-all ${data.accent_color === c.value ? 'border-indigo-500 scale-110 ring-2 ring-indigo-300' : 'border-gray-300 dark:border-gray-600'}`}
                                                        style={{ backgroundColor: c.value }}
                                                        title={c.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Opsi Tambahan */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Opsi Tambahan</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel htmlFor="judul_layar" value="Judul Custom (Opsional)" />
                                            <TextInput
                                                id="judul_layar"
                                                className="mt-1 block w-full"
                                                value={data.judul_layar}
                                                onChange={(e: any) => setData('judul_layar', e.target.value)}
                                                placeholder="Contoh: WORLD TIME DISPLAY"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Jika kosong akan menampilkan nama bandara</p>
                                            <InputError message={errors.judul_layar} className="mt-2" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={data.show_nama_bandara} onChange={(e) => setData('show_nama_bandara', e.target.checked)} />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Tampilkan nama bandara</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={data.show_ntp_status} onChange={(e) => setData('show_ntp_status', e.target.checked)} />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Tampilkan status sinkronisasi NTP</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={data.use_background_image} onChange={(e) => setData('use_background_image', e.target.checked)} />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Gunakan background dari Pengaturan Layar FIDS</span>
                                            </label>
                                            {data.use_background_image && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400 ml-7">Background header yang diupload di Pengaturan Layar FIDS akan digunakan sebagai latar belakang layar World Clock.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <PrimaryButton disabled={processing}>Simpan Pengaturan</PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
