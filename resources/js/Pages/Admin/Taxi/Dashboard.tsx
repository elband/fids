import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import TaxiShell, { TaxiStat } from './Partials/TaxiShell';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import {
    AlertTriangle, Film, MonitorSmartphone, PlaneTakeoff, Signpost,
    Type, Wallet, Wifi, WifiOff, ShieldAlert, ShieldCheck,
} from 'lucide-react';

interface Stats {
    videos_total: number;
    videos_aktif: number;
    videos_playlist: number;
    playlist_sekarang: string;
    tarif_total: number;
    tarif_berlaku: number;
    petunjuk_aktif: number;
    running_text_aktif: number;
    penerbangan_tayang: number;
    layar_online: number;
    layar_total: number;
}

interface Props {
    stats: Stats;
    emergency: { active: boolean; judul: string | null; pesan: string | null; sampai: string | null };
    topVideos: { id: number; judul: string; play_count: number; total_play_seconds: number; last_played_at: string | null }[];
    screens: { id: number; kode: string; nama: string | null; lokasi: string | null; resolusi: string | null; ip_address: string | null; online: boolean; last_seen_at: string | null }[];
}

const PLAYLIST_LABEL: Record<string, string> = {
    pagi: 'Pagi (04–11)',
    siang: 'Siang (11–18)',
    malam: 'Malam (18–04)',
};

export default function Dashboard({ stats, emergency, topVideos, screens }: Props) {
    return (
        <TaxiShell
            title="Dashboard Taxi Information"
            subtitle="Ringkasan konten yang sedang tayang di layar signage taksi: video, tarif, petunjuk arah, running text, dan status setiap layar."
            stats={
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <TaxiStat label="Video Aktif" value={`${stats.videos_aktif}/${stats.videos_total}`} icon={<Film size={13} />} />
                    <TaxiStat label="Playlist Kini" value={stats.videos_playlist} icon={<Film size={13} />} />
                    <TaxiStat label="Tarif Berlaku" value={`${stats.tarif_berlaku}/${stats.tarif_total}`} icon={<Wallet size={13} />} />
                    <TaxiStat label="Petunjuk Aktif" value={stats.petunjuk_aktif} icon={<Signpost size={13} />} />
                    <TaxiStat label="Running Text" value={stats.running_text_aktif} icon={<Type size={13} />} />
                    <TaxiStat label="Jadwal Tayang" value={stats.penerbangan_tayang} icon={<PlaneTakeoff size={13} />} />
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <EmergencyCard emergency={emergency} />

                <div className="space-y-6">
                    <Card
                        title="Playlist Jam Operasional"
                        icon={<Film size={16} className="text-amber-500" />}
                    >
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Sesi yang sedang berjalan
                        </p>
                        <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                            {PLAYLIST_LABEL[stats.playlist_sekarang] ?? stats.playlist_sekarang}
                        </p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-bold text-gray-800 dark:text-gray-200">{stats.videos_playlist}</span> video
                            sedang masuk antrean putar (termasuk playlist “Semua Jam”).
                        </p>
                    </Card>

                    <Card
                        title="Status Layar"
                        icon={<MonitorSmartphone size={16} className="text-amber-500" />}
                    >
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                                {stats.layar_online}
                            </span>
                            <span className="text-sm text-gray-500">dari {stats.layar_total} layar online</span>
                        </div>
                        <ul className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
                            {screens.length === 0 && (
                                <li className="text-sm text-gray-400">
                                    Belum ada layar terdaftar. Buka layar dengan <code>?screen=kode-layar</code> agar tercatat.
                                </li>
                            )}
                            {screens.map((s) => (
                                <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="flex items-center gap-2 min-w-0">
                                        {s.online
                                            ? <Wifi size={14} className="text-emerald-500 shrink-0" />
                                            : <WifiOff size={14} className="text-red-500 shrink-0" />}
                                        <span className="truncate text-gray-700 dark:text-gray-300">{s.nama || s.kode}</span>
                                    </span>
                                    <span className="text-xs text-gray-400 shrink-0">
                                        {s.last_seen_at ? new Date(s.last_seen_at).toLocaleTimeString('id-ID') : '—'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>

                <Card title="Video Paling Sering Diputar" icon={<Film size={16} className="text-amber-500" />}>
                    {topVideos.length === 0 ? (
                        <p className="text-sm text-gray-400">Belum ada statistik pemutaran.</p>
                    ) : (
                        <ol className="space-y-3">
                            {topVideos.map((v, i) => (
                                <li key={v.id} className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 grid place-items-center text-xs font-black shrink-0">
                                        {i + 1}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{v.judul}</span>
                                        <span className="block text-xs text-gray-500">
                                            {v.play_count}× tayang · total {formatDuration(v.total_play_seconds)}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </Card>
            </div>
        </TaxiShell>
    );
}

function EmergencyCard({ emergency }: { emergency: Props['emergency'] }) {
    const { data, setData, post, processing, errors, transform } = useForm({
        emergency_active: emergency.active,
        emergency_judul: emergency.judul ?? '',
        emergency_pesan: emergency.pesan ?? '',
        emergency_sampai: emergency.sampai ?? '',
    });

    const submit = (active: boolean) => (e: FormEvent) => {
        e.preventDefault();
        // Tombol selalu mengirim status lawan dari kondisi sekarang; transform
        // dipakai agar nilainya pasti ikut terkirim tanpa menunggu setData.
        transform((d) => ({ ...d, emergency_active: active }));
        post(route('admin.taxi.emergency'), { preserveScroll: true });
    };

    return (
        <form
            onSubmit={submit(!data.emergency_active)}
            className={`rounded-2xl border shadow-sm p-5 space-y-4 ${
                emergency.active
                    ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800'
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
        >
            <div className="flex items-center gap-2">
                {emergency.active
                    ? <ShieldAlert size={18} className="text-red-600" />
                    : <ShieldCheck size={18} className="text-emerald-600" />}
                <h4 className="font-bold text-gray-900 dark:text-white">Emergency Override</h4>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
                Menampilkan pesan darurat penuh layar dan menyembunyikan seluruh konten lain
                sampai dimatikan atau melewati batas waktu.
            </p>

            {emergency.active && (
                <div className="flex items-center gap-2 rounded-xl bg-red-600 text-white px-3 py-2 text-sm font-bold">
                    <AlertTriangle size={16} /> Sedang aktif di semua layar
                </div>
            )}

            <div>
                <InputLabel htmlFor="emergency_judul" value="Judul" />
                <TextInput
                    id="emergency_judul"
                    className="mt-1 block w-full"
                    value={data.emergency_judul}
                    onChange={(e) => setData('emergency_judul', e.target.value)}
                    placeholder="PERUBAHAN LOKASI COUNTER TAKSI"
                />
                <InputError message={errors.emergency_judul} className="mt-1" />
            </div>

            <div>
                <InputLabel htmlFor="emergency_pesan" value="Pesan" />
                <textarea
                    id="emergency_pesan"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:border-amber-500 focus:ring-amber-500"
                    value={data.emergency_pesan}
                    onChange={(e) => setData('emergency_pesan', e.target.value)}
                    placeholder="Counter taksi resmi dipindahkan sementara ke Pintu Kedatangan B."
                />
                <InputError message={errors.emergency_pesan} className="mt-1" />
            </div>

            <div>
                <InputLabel htmlFor="emergency_sampai" value="Berlaku sampai (opsional)" />
                <TextInput
                    id="emergency_sampai"
                    type="datetime-local"
                    className="mt-1 block w-full"
                    value={data.emergency_sampai}
                    onChange={(e) => setData('emergency_sampai', e.target.value)}
                />
                <InputError message={errors.emergency_sampai} className="mt-1" />
            </div>

            <PrimaryButton
                disabled={processing}
                className={emergency.active ? '!bg-gray-700 hover:!bg-gray-800' : '!bg-red-600 hover:!bg-red-700'}
            >
                {emergency.active ? 'Matikan Override' : 'Aktifkan Override'}
            </PrimaryButton>
        </form>
    );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
            </div>
            {children}
        </div>
    );
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}j ${m}m`;
    return `${m}m ${seconds % 60}d`;
}
