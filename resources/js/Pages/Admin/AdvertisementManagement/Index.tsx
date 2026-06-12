import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import {
    Plus, Edit2, Trash2, X, Image as ImageIcon, Video, Monitor,
    Clock, Sparkles, Search, ChevronUp, ChevronDown, Play, Pause, Eye, EyeOff,
} from 'lucide-react';
import { appConfirm } from '@/lib/confirm';

interface Advertisement {
    id: number;
    title: string;
    media_path: string | null;
    media_type: 'image' | 'video';
    duration: number;
    status: string;
    order_index: number;
}

interface Props {
    ads: Advertisement[];
}

const STATUS_PALETTE: Record<string, { label: string; chip: string; ring: string; stripe: string }> = {
    active:    { label: 'Aktif',     chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', ring: 'ring-emerald-300/40', stripe: 'from-emerald-400 to-cyan-400' },
    draft:     { label: 'Draft',     chip: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200',         ring: 'ring-slate-300/40',   stripe: 'from-slate-400 to-zinc-400' },
    scheduled: { label: 'Terjadwal', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',         ring: 'ring-amber-300/40',   stripe: 'from-amber-400 to-orange-400' },
};

function statusOf(s: string) {
    return STATUS_PALETTE[s] ?? STATUS_PALETTE.draft;
}

export default function Index({ ads }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'scheduled'>('all');
    const [query, setQuery] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        media: null as File | null,
        media_type: 'image' as 'image' | 'video',
        duration: 15,
        status: 'active',
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (data.media) {
            const url = URL.createObjectURL(data.media);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
    }, [data.media]);

    const stats = useMemo(() => {
        const active = ads.filter((a) => a.status === 'active').length;
        const totalDuration = ads.reduce((s, a) => s + (Number(a.duration) || 0), 0);
        const videos = ads.filter((a) => a.media_type === 'video').length;
        const images = ads.filter((a) => a.media_type === 'image').length;
        return { active, totalDuration, videos, images, total: ads.length };
    }, [ads]);

    const filteredAds = useMemo(() => {
        return ads.filter((a) => {
            if (filter !== 'all' && a.status !== filter) return false;
            if (query && !a.title.toLowerCase().includes(query.toLowerCase())) return false;
            return true;
        });
    }, [ads, filter, query]);

    const openModal = (ad?: Advertisement) => {
        if (ad) {
            setEditingAd(ad);
            setData({
                title: ad.title,
                media: null,
                media_type: ad.media_type,
                duration: ad.duration,
                status: ad.status,
            });
        } else {
            setEditingAd(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAd(null);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAd) {
            router.post(route('admin.advertisements.update', editingAd.id), {
                ...data,
                _method: 'PUT',
            }, {
                forceFormData: true,
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.advertisements.store'), {
                forceFormData: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Iklan',
            message: 'Apakah Anda yakin ingin menghapus iklan ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        router.delete(route('admin.advertisements.destroy', id), {
            preserveScroll: true,
            onError: () => router.reload({ only: ['ads'] }),
        });
    };

    const moveOrder = (ad: Advertisement, dir: -1 | 1) => {
        // Optimistic: send PUT update with new order_index
        const newIndex = Math.max(0, (ad.order_index ?? 0) + dir);
        router.post(route('admin.advertisements.update', ad.id), {
            title: ad.title,
            media_type: ad.media_type,
            duration: ad.duration,
            status: ad.status,
            order_index: newIndex,
            _method: 'PUT',
        }, { preserveScroll: true });
    };

    const toggleStatus = (ad: Advertisement) => {
        const next = ad.status === 'active' ? 'draft' : 'active';
        router.post(route('admin.advertisements.update', ad.id), {
            title: ad.title,
            media_type: ad.media_type,
            duration: ad.duration,
            status: next,
            order_index: ad.order_index,
            _method: 'PUT',
        }, { preserveScroll: true });
    };

    const formatDuration = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Advertisement Management
                </h2>
            }
        >
            <Head title="Advertisement Management" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    {/* Hero / Stats Card */}
                    <div className="relative overflow-hidden rounded-3xl shadow-xl border border-white/10 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-white">
                        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-pink-300/30 blur-3xl" />
                        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-violet-300/30 blur-3xl" />
                        <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
                            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                            backgroundSize: '18px 18px',
                        }} />

                        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-6 p-8 lg:p-10 items-center">
                            <div className="lg:col-span-3 space-y-5">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 text-[11px] font-bold uppercase tracking-[0.2em]">
                                    <Sparkles size={12} />
                                    Digital Signage Studio
                                </div>
                                <h3 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">
                                    Kelola Iklan & Konten Tampilan
                                </h3>
                                <p className="text-base lg:text-lg leading-relaxed text-white/85 max-w-2xl">
                                    Atur playlist gambar dan video untuk layar publik. Sesuaikan urutan,
                                    durasi tayang, dan status aktif. Konten otomatis tampil dengan transisi animasi.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => openModal()}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-fuchsia-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                                    >
                                        <Plus size={18} /> Tambah Iklan
                                    </button>
                                    <a
                                        href={route('display.advertisement')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/25 text-white font-semibold hover:bg-white/20 transition"
                                    >
                                        <Monitor size={16} /> Buka Layar Iklan
                                    </a>
                                </div>
                            </div>

                            {/* Stats grid */}
                            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
                                <StatChip label="Total Iklan" value={stats.total} icon={<Sparkles size={16} />} />
                                <StatChip label="Aktif" value={stats.active} icon={<Play size={16} />} />
                                <StatChip label="Gambar" value={stats.images} icon={<ImageIcon size={16} />} />
                                <StatChip label="Video" value={stats.videos} icon={<Video size={16} />} />
                                <StatChip
                                    label="Durasi Playlist"
                                    value={formatDuration(stats.totalDuration)}
                                    icon={<Clock size={16} />}
                                    wide
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filter / Search Toolbar */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari iklan berdasarkan judul..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-fuchsia-500 focus:ring focus:ring-fuchsia-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700">
                            {(['all', 'active', 'draft', 'scheduled'] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition ${
                                        filter === f
                                            ? 'bg-white dark:bg-gray-700 text-fuchsia-700 dark:text-fuchsia-200 shadow'
                                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {f === 'all' ? 'Semua' : statusOf(f).label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ad Cards Grid */}
                    {filteredAds.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-900/30 flex items-center justify-center mx-auto mb-4">
                                <ImageIcon size={28} className="text-fuchsia-500" />
                            </div>
                            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                {ads.length === 0 ? 'Belum ada iklan' : 'Tidak ada iklan yang cocok'}
                            </h5>
                            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                                {ads.length === 0
                                    ? 'Klik "Tambah Iklan" untuk menambahkan konten iklan pertama Anda.'
                                    : 'Coba ubah kata kunci pencarian atau filter status.'}
                            </p>
                            {ads.length === 0 && (
                                <button
                                    type="button"
                                    onClick={() => openModal()}
                                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-fuchsia-600 text-white text-sm font-bold hover:bg-fuchsia-700 transition shadow"
                                >
                                    <Plus size={16} /> Tambah Iklan
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredAds.map((ad) => (
                                <AdCard
                                    key={ad.id}
                                    ad={ad}
                                    onEdit={() => openModal(ad)}
                                    onDelete={() => handleDelete(ad.id)}
                                    onMoveUp={() => moveOrder(ad, -1)}
                                    onMoveDown={() => moveOrder(ad, 1)}
                                    onToggle={() => toggleStatus(ad)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="lg">
                <form onSubmit={submit} className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingAd ? 'Edit Iklan' : 'Tambah Iklan Baru'}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {editingAd ? 'Perbarui detail dan media iklan' : 'Unggah gambar atau video untuk ditayangkan'}
                            </p>
                        </div>
                        <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Left column: form */}
                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="title" value="Judul Iklan" />
                                <TextInput
                                    id="title"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                    placeholder="Contoh: Promo Lounge Garuda"
                                />
                                <InputError message={errors.title} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="media_type" value="Jenis Media" />
                                    <select
                                        id="media_type"
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                        value={data.media_type}
                                        onChange={(e) => setData('media_type', e.target.value as 'image' | 'video')}
                                    >
                                        <option value="image">Gambar</option>
                                        <option value="video">Video</option>
                                    </select>
                                    <InputError message={errors.media_type} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="duration" value="Durasi (Detik)" />
                                    <TextInput
                                        id="duration"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.duration}
                                        onChange={(e) => setData('duration', parseInt(e.target.value) || 1)}
                                        required
                                        min={1}
                                    />
                                    <InputError message={errors.duration} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="media" value={editingAd ? 'Ganti File Media (opsional)' : 'File Media'} />
                                <input
                                    id="media"
                                    type="file"
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 dark:file:bg-gray-700 dark:file:text-gray-200"
                                    onChange={(e) => setData('media', e.target.files ? e.target.files[0] : null)}
                                    required={!editingAd}
                                    accept={data.media_type === 'image' ? 'image/*' : 'video/*'}
                                />
                                <InputError message={errors.media} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="status" value="Status" />
                                <div className="mt-1 grid grid-cols-3 gap-2">
                                    {(['active', 'draft', 'scheduled'] as const).map((s) => {
                                        const sp = statusOf(s);
                                        return (
                                            <button
                                                type="button"
                                                key={s}
                                                onClick={() => setData('status', s)}
                                                className={`px-2 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest border transition ${
                                                    data.status === s
                                                        ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/30 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-200'
                                                        : `border-gray-200 dark:border-gray-700 ${sp.chip} hover:opacity-80`
                                                }`}
                                            >
                                                {sp.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                        </div>

                        {/* Right column: live preview */}
                        <div>
                            <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Pratinjau</p>
                            <div className="aspect-video rounded-xl bg-slate-900 ring-1 ring-slate-700 overflow-hidden flex items-center justify-center text-white relative">
                                {previewUrl ? (
                                    data.media_type === 'image' ? (
                                        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <video src={previewUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                    )
                                ) : editingAd?.media_path ? (
                                    editingAd.media_type === 'image' ? (
                                        <img src={`/storage/${editingAd.media_path}`} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <video src={`/storage/${editingAd.media_path}`} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                    )
                                ) : (
                                    <div className="text-center text-white/40 px-4">
                                        {data.media_type === 'video' ? <Video size={36} className="mx-auto" /> : <ImageIcon size={36} className="mx-auto" />}
                                        <p className="mt-2 text-xs uppercase tracking-widest">Belum ada media</p>
                                    </div>
                                )}
                                {/* simulated live overlay */}
                                <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/85 backdrop-blur text-[10px] font-black tracking-widest">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                    </span>
                                    LIVE
                                </div>
                                <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400" />
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2">Tampilan akan menyesuaikan layar publik (16:9).</p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <SecondaryButton type="button" onClick={closeModal}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingAd ? 'Simpan Perubahan' : 'Tambah Iklan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

function StatChip({ label, value, icon, wide = false }: { label: string; value: React.ReactNode; icon: React.ReactNode; wide?: boolean }) {
    return (
        <div className={`rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20 px-4 py-3 ${wide ? 'col-span-2' : ''}`}>
            <div className="flex items-center gap-2 text-white/80 text-[10px] uppercase tracking-[0.2em] font-bold">
                {icon}
                {label}
            </div>
            <div className="mt-1 text-2xl font-black tabular-nums">{value}</div>
        </div>
    );
}

function AdCard({
    ad,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
    onToggle,
}: {
    ad: Advertisement;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onToggle: () => void;
}) {
    const sp = statusOf(ad.status);
    const isActive = ad.status === 'active';

    return (
        <div className={`group relative rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-fuchsia-300 dark:hover:ring-fuchsia-500 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden`}>
            {/* status stripe */}
            <div className={`h-1 w-full bg-gradient-to-r ${sp.stripe}`} />

            {/* preview */}
            <div className="relative aspect-video bg-slate-900 overflow-hidden">
                {ad.media_path ? (
                    ad.media_type === 'image' ? (
                        <img src={`/storage/${ad.media_path}`} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                        <video src={`/storage/${ad.media_path}`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                        <ImageIcon size={32} />
                    </div>
                )}

                {/* type badge */}
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest">
                    {ad.media_type === 'video' ? <Video size={11} /> : <ImageIcon size={11} />}
                    {ad.media_type}
                </span>

                {/* duration */}
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-bold tabular-nums">
                    <Clock size={10} /> {ad.duration}s
                </span>

                {/* order index */}
                <span className="absolute bottom-2 left-2 inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-fuchsia-600/90 text-white text-[11px] font-black tabular-nums shadow">
                    #{(ad.order_index ?? 0) + 1}
                </span>

                {/* hover overlay actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition flex items-end justify-center p-3 gap-2">
                    <button
                        onClick={onMoveUp}
                        className="px-2 py-1.5 rounded-md bg-white/95 text-gray-700 hover:bg-white text-xs font-bold flex items-center gap-1"
                        title="Naikkan urutan"
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button
                        onClick={onMoveDown}
                        className="px-2 py-1.5 rounded-md bg-white/95 text-gray-700 hover:bg-white text-xs font-bold flex items-center gap-1"
                        title="Turunkan urutan"
                    >
                        <ChevronDown size={14} />
                    </button>
                    <button
                        onClick={onToggle}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 ${
                            isActive ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                        title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                        {isActive ? <Pause size={12} /> : <Play size={12} />}
                        {isActive ? 'Pause' : 'Play'}
                    </button>
                </div>
            </div>

            {/* body */}
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h5 className="text-sm font-bold text-gray-900 dark:text-white leading-snug truncate flex-1">{ad.title}</h5>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${sp.chip}`}>
                        {sp.label}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    {isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Eye size={12} /> Tayang di layar publik
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 font-semibold">
                            <EyeOff size={12} /> Tidak tayang
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <button
                        onClick={onEdit}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-600 hover:text-white transition border border-fuchsia-100 dark:bg-fuchsia-900/30 dark:text-fuchsia-200 dark:border-fuchsia-700/40"
                    >
                        <Edit2 size={12} /> Edit
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        title="Hapus"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
