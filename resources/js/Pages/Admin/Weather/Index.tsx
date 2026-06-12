import { useForm, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Cloud, Thermometer, Wind, Droplets } from 'lucide-react';

interface WeatherInfo {
    lokasi: string;
    suhu: number;
    kondisi_cuaca: string;
    kelembapan: number | null;
    kecepatan_angin: number | null;
    arah_angin: string | null;
    arah_angin_derajat: number | null;
}

const ARAH_ANGIN_OPTIONS = [
    { code: 'N',  label: 'Utara (N)',         deg: 0   },
    { code: 'NE', label: 'Timur Laut (NE)',   deg: 45  },
    { code: 'E',  label: 'Timur (E)',         deg: 90  },
    { code: 'SE', label: 'Tenggara (SE)',     deg: 135 },
    { code: 'S',  label: 'Selatan (S)',       deg: 180 },
    { code: 'SW', label: 'Barat Daya (SW)',   deg: 225 },
    { code: 'W',  label: 'Barat (W)',         deg: 270 },
    { code: 'NW', label: 'Barat Laut (NW)',   deg: 315 },
];

export default function Index({ auth, weather }: PageProps<{ weather: WeatherInfo | null }>) {
    const { data, setData, post, processing, errors } = useForm({
        lokasi: weather?.lokasi || 'Samarinda',
        suhu: weather?.suhu || 30,
        kondisi_cuaca: weather?.kondisi_cuaca || 'Cerah',
        kelembapan: weather?.kelembapan || 70,
        kecepatan_angin: weather?.kecepatan_angin || 5,
        arah_angin: weather?.arah_angin || '',
        arah_angin_derajat: weather?.arah_angin_derajat ?? '' as number | string,
    });

    const handleArahChange = (code: string) => {
        const opt = ARAH_ANGIN_OPTIONS.find(o => o.code === code);
        setData(d => ({ ...d, arah_angin: code, arah_angin_derajat: opt ? opt.deg : '' }));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.weather-infos.store'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Informasi Cuaca</h2>}
        >
            <Head title="Informasi Cuaca" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Status Cuaca Terkini</h3>
                                    <p className="text-sm text-gray-600">Informasi ini akan ditampilkan di monitor publik FIDS.</p>
                                </div>
                                <div className="flex items-center gap-4 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Database Sekarang</p>
                                        <p className="text-2xl font-black text-blue-900">{weather?.suhu || '--'}°C - {weather?.kondisi_cuaca || '---'}</p>
                                    </div>
                                    <Thermometer className="text-blue-500" size={32} />
                                </div>
                            </div>

                            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="lokasi" value="Lokasi" />
                                        <TextInput
                                            id="lokasi"
                                            className="mt-1 block w-full"
                                            value={data.lokasi}
                                            onChange={(e: any) => setData('lokasi', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.lokasi} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="suhu" value="Suhu (°C)" />
                                        <div className="relative mt-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Thermometer size={18} className="text-gray-400" />
                                            </div>
                                            <TextInput
                                                id="suhu"
                                                type="number"
                                                step="0.1"
                                                className="pl-10 block w-full"
                                                value={data.suhu}
                                                onChange={(e: any) => setData('suhu', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <InputError message={errors.suhu} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="kondisi_cuaca" value="Kondisi Cuaca" />
                                        <div className="relative mt-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Cloud size={18} className="text-gray-400" />
                                            </div>
                                            <TextInput
                                                id="kondisi_cuaca"
                                                className="pl-10 block w-full"
                                                value={data.kondisi_cuaca}
                                                onChange={(e: any) => setData('kondisi_cuaca', e.target.value)}
                                                required
                                                placeholder="Contoh: Cerah, Berawan, Hujan Ringan"
                                            />
                                        </div>
                                        <InputError message={errors.kondisi_cuaca} className="mt-2" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="kelembapan" value="Kelembapan (%)" />
                                        <div className="relative mt-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Droplets size={18} className="text-gray-400" />
                                            </div>
                                            <TextInput
                                                id="kelembapan"
                                                type="number"
                                                className="pl-10 block w-full"
                                                value={data.kelembapan}
                                                onChange={(e: any) => setData('kelembapan', e.target.value)}
                                            />
                                        </div>
                                        <InputError message={errors.kelembapan} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="kecepatan_angin" value="Kecepatan Angin (km/jam)" />
                                        <div className="relative mt-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Wind size={18} className="text-gray-400" />
                                            </div>
                                            <TextInput
                                                id="kecepatan_angin"
                                                type="number"
                                                step="0.1"
                                                className="pl-10 block w-full"
                                                value={data.kecepatan_angin}
                                                onChange={(e: any) => setData('kecepatan_angin', e.target.value)}
                                            />
                                        </div>
                                        <InputError message={errors.kecepatan_angin} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="arah_angin" value="Arah Angin" />
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <select
                                                id="arah_angin"
                                                className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                                value={data.arah_angin}
                                                onChange={(e) => handleArahChange(e.target.value)}
                                            >
                                                <option value="">— Tidak diset —</option>
                                                {ARAH_ANGIN_OPTIONS.map(o => (
                                                    <option key={o.code} value={o.code}>{o.label}</option>
                                                ))}
                                            </select>
                                            <TextInput
                                                id="arah_angin_derajat"
                                                type="number"
                                                min={0}
                                                max={360}
                                                className="block w-full"
                                                value={data.arah_angin_derajat as any}
                                                onChange={(e: any) => setData('arah_angin_derajat', e.target.value)}
                                                placeholder="Derajat (0-360)"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Pilih kompas atau isi derajat manual. Field arah otomatis mengisi derajat.</p>
                                        <InputError message={errors.arah_angin} className="mt-2" />
                                        <InputError message={errors.arah_angin_derajat} className="mt-1" />
                                    </div>

                                    <div className="pt-4 flex items-center justify-end gap-4">
                                        <p className="text-xs text-gray-500 italic">
                                            * Perubahan manual akan bertahan sampai jadwal fetch BMKG berikutnya dijalankan.
                                        </p>
                                        <PrimaryButton disabled={processing}>Perbarui Cuaca</PrimaryButton>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
