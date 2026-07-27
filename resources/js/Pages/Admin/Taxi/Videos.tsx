import { router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import TaxiShell, { TaxiStat } from './Partials/TaxiShell';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Field, FileInput } from './Directions';
import { appConfirm } from '@/lib/confirm';
import {
    ChevronDown, ChevronUp, Clock, Edit2, Film, Play, PlayCircle,
    Plus, RotateCcw, Trash2, X,
} from 'lucide-react';

interface Video {
    id: number;
    judul: string;
    url: string | null;
    thumbnail_url: string | null;
    durasi_detik: number | null;
    playlist: 'all' | 'pagi' | 'siang' | 'malam';
    hari: number[] | null;
    is_active: boolean;
    order_index: number;
    play_count: number;
    total_play_seconds: number;
    last_played_at: string | null;
}

interface Props {
    videos: Video[];
}

const PLAYLISTS = [
    { value: 'all', label: 'Semua Jam' },
    { value: 'pagi', label: 'Pagi (04–11)' },
    { value: 'siang', label: 'Siang (11–18)' },
    { value: 'malam', label: 'Malam (18–04)' },
] as const;

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const EMPTY = {
    judul: '',
    video: null as File | null,
    thumbnail: null as File | null,
    durasi_detik: '' as number | string,
    playlist: 'all' as Video['playlist'],
    hari: [] as number[],
    is_active: true,
    order_index: '' as number | string,
};

export default function Videos({ videos }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Video | null>(null);
    const { data, setData, post, processing, errors, reset, clearErrors, transform } = useForm({ ...EMPTY });

    const openModal = (v?: Video) => {
        clearErrors();
        if (v) {
            setEditing(v);
            setData({
                judul: v.judul,
                video: null,
                thumbnail: null,
                durasi_detik: v.durasi_detik ?? '',
                playlist: v.playlist,
                hari: v.hari ?? [],
                is_active: v.is_active,
                order_index: v.order_index,
            });
        } else {
            setEditing(null);
            reset();
        }
        setOpen(true);
    };

    const close = () => { setOpen(false); setEditing(null); reset(); };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        transform((d) => ({
            ...d,
            is_active: d.is_active ? 1 : 0,
            ...(editing ? { _method: 'PUT' } : {}),
        }));
        post(
            editing ? route('admin.taxi.videos.update', editing.id) : route('admin.taxi.videos.store'),
            { forceFormData: true, preserveScroll: true, onSuccess: close },
        );
    };

    const remove = async (v: Video) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Video',
            message: `Hapus "${v.judul}" dari playlist beserta berkasnya?`,
            confirmText: 'Hapus', cancelText: 'Batal',
        });
        if (!ok) return;
        router.delete(route('admin.taxi.videos.destroy', v.id), { preserveScroll: true });
    };

    /** Geser urutan tayang; kolom lain dikirim ulang agar validasi lolos. */
    const move = (v: Video, dir: -1 | 1) => {
        router.post(route('admin.taxi.videos.update', v.id), {
            _method: 'PUT',
            judul: v.judul,
            durasi_detik: v.durasi_detik ?? '',
            playlist: v.playlist,
            hari: v.hari ?? [],
            is_active: v.is_active ? 1 : 0,
            order_index: Math.max(0, v.order_index + dir),
        }, { preserveScroll: true });
    };

    const toggle = (v: Video) => {
        router.post(route('admin.taxi.videos.update', v.id), {
            _method: 'PUT',
            judul: v.judul,
            durasi_detik: v.durasi_detik ?? '',
            playlist: v.playlist,
            hari: v.hari ?? [],
            is_active: v.is_active ? 0 : 1,
            order_index: v.order_index,
        }, { preserveScroll: true });
    };

    const resetStats = (v: Video) => {
        router.post(route('admin.taxi.videos.reset-stats', v.id), {}, { preserveScroll: true });
    };

    const totalPlays = videos.reduce((s, v) => s + v.play_count, 0);
    const aktif = videos.filter((v) => v.is_active).length;

    return (
        <TaxiShell
            title="Playlist Video"
            subtitle="Video MP4 diputar berurutan tanpa kontrol pemutar, otomatis lanjut ke video berikutnya, dan otomatis dilewati bila gagal dimuat. Playlist bisa dibedakan per jam operasional dan hari."
            action={
                <button type="button" onClick={() => openModal()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition">
                    <Plus size={18} /> Tambah Video
                </button>
            }
            stats={
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <TaxiStat label="Total Video" value={videos.length} icon={<Film size={13} />} />
                    <TaxiStat label="Aktif" value={aktif} icon={<Play size={13} />} />
                    <TaxiStat label="Total Tayang" value={totalPlays} icon={<PlayCircle size={13} />} />
                </div>
            }
        >
            {videos.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                    <Film size={28} className="mx-auto text-amber-500" />
                    <h5 className="mt-3 font-bold text-gray-700 dark:text-gray-200">Belum ada video</h5>
                    <p className="text-sm text-gray-500 mt-1">Unggah MP4 untuk mulai menayangkan promosi di layar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {videos.map((v) => (
                        <div key={v.id} className="rounded-2xl bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
                            <div className="relative aspect-video bg-slate-900">
                                {v.url && (
                                    <video src={v.url} poster={v.thumbnail_url ?? undefined}
                                           className="absolute inset-0 h-full w-full object-cover"
                                           muted playsInline preload="metadata" />
                                )}
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/65 text-white text-[10px] font-black uppercase tracking-widest">
                                    {PLAYLISTS.find((p) => p.value === v.playlist)?.label}
                                </span>
                                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    v.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white/80'
                                }`}>
                                    {v.is_active ? 'Tayang' : 'Jeda'}
                                </span>
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black tabular-nums">
                                    #{v.order_index}
                                </span>
                                {v.durasi_detik && (
                                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 text-white text-[10px] font-bold tabular-nums">
                                        <Clock size={10} /> {v.durasi_detik}s
                                    </span>
                                )}
                            </div>

                            <div className="p-4 space-y-3">
                                <h5 className="font-bold text-gray-900 dark:text-white truncate">{v.judul}</h5>

                                <div className="flex flex-wrap gap-1">
                                    {(v.hari && v.hari.length > 0 ? v.hari : null)
                                        ? v.hari!.map((d) => (
                                            <span key={d} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                {DAYS[d]}
                                            </span>
                                        ))
                                        : <span className="text-[11px] text-gray-400">Setiap hari</span>}
                                </div>

                                <p className="text-xs text-gray-500">
                                    {v.play_count}× tayang · {Math.round(v.total_play_seconds / 60)} menit total
                                    {v.last_played_at && ` · terakhir ${new Date(v.last_played_at).toLocaleString('id-ID')}`}
                                </p>

                                <div className="flex items-center gap-1.5 pt-1">
                                    <button onClick={() => move(v, -1)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700" title="Naikkan urutan">
                                        <ChevronUp size={14} />
                                    </button>
                                    <button onClick={() => move(v, 1)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700" title="Turunkan urutan">
                                        <ChevronDown size={14} />
                                    </button>
                                    <button onClick={() => toggle(v)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                        v.is_active ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    }`}>
                                        {v.is_active ? 'Jeda' : 'Tayang'}
                                    </button>
                                    <button onClick={() => resetStats(v)} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Reset statistik">
                                        <RotateCcw size={14} />
                                    </button>
                                    <span className="flex-1" />
                                    <button onClick={() => openModal(v)} className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30" title="Edit">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => remove(v)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Hapus">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal show={open} onClose={close} maxWidth="lg">
                <form onSubmit={submit} className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {editing ? 'Edit Video' : 'Tambah Video'}
                        </h2>
                        <button type="button" onClick={close} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Field label="Judul" error={errors.judul}>
                                <TextInput className="mt-1 block w-full" value={data.judul} required
                                           onChange={(e) => setData('judul', e.target.value)}
                                           placeholder="Promo Layanan Taksi Resmi" />
                            </Field>
                        </div>

                        <Field label={`Berkas MP4 ${editing ? '(kosongkan bila tidak diganti)' : ''}`} error={errors.video}>
                            <FileInput accept="video/mp4" onChange={(f) => setData('video', f)} />
                            <p className="mt-1 text-[11px] text-gray-400">Maksimal 200 MB, format MP4 Full HD.</p>
                        </Field>
                        <Field label="Thumbnail (opsional)" error={errors.thumbnail}>
                            <FileInput accept="image/*" onChange={(f) => setData('thumbnail', f)} />
                        </Field>

                        <Field label="Playlist jam operasional" error={errors.playlist}>
                            <select
                                value={data.playlist}
                                onChange={(e) => setData('playlist', e.target.value as Video['playlist'])}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:border-amber-500 focus:ring-amber-500"
                            >
                                {PLAYLISTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Durasi (detik, opsional)" error={errors.durasi_detik}>
                            <TextInput type="number" min={1} className="mt-1 block w-full" value={data.durasi_detik}
                                       onChange={(e) => setData('durasi_detik', e.target.value)} placeholder="30" />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Hari tayang (kosongkan untuk setiap hari)" error={errors.hari}>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {DAYS.map((label, idx) => {
                                        const checked = data.hari.includes(idx);
                                        return (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => setData('hari', checked
                                                    ? data.hari.filter((d) => d !== idx)
                                                    : [...data.hari, idx].sort())}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition ${
                                                    checked
                                                        ? 'bg-amber-500 text-slate-900 border-amber-500'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-400'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>
                        </div>

                        <Field label="Urutan playlist" error={errors.order_index}>
                            <TextInput type="number" min={0} className="mt-1 block w-full" value={data.order_index}
                                       onChange={(e) => setData('order_index', e.target.value)} />
                        </Field>
                        <Field label="Status" error={errors.is_active}>
                            <label className="mt-2 inline-flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={data.is_active}
                                       onChange={(e) => setData('is_active', e.target.checked)}
                                       className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Aktif di playlist</span>
                            </label>
                        </Field>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <SecondaryButton type="button" onClick={close}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>{editing ? 'Simpan' : 'Unggah'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </TaxiShell>
    );
}
