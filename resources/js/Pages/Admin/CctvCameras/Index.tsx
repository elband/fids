import { useMemo, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import {
    Camera, Plus, Pencil, Trash2, ExternalLink, Power, PowerOff, Eye, AlertTriangle, X,
    Search, MapPin, Layers, Hash, Sparkles, Wifi, Film, Monitor as MonitorIcon, Image as ImageIcon,
} from 'lucide-react';
import { appConfirm } from '@/lib/confirm';

interface Cam {
    id: number;
    nama: string;
    lokasi: string | null;
    grup: string;
    baggage_claim_id: number | null;
    baggage_claim?: { id: number; nomor_belt: string | number; terminal: string | null; area: string | null } | null;
    jenis_stream: 'iframe' | 'mjpeg' | 'youtube';
    url_stream: string;
    aktif: boolean;
    urutan: number;
}

interface BaggageClaimOption {
    id: number;
    nomor_belt: string | number;
    terminal: string | null;
    area: string | null;
}

const GRUP_OPTIONS = [
    { value: 'baggage',  label: 'Pengambilan Bagasi', short: 'BAGASI',   tone: 'fuchsia' },
    { value: 'boarding', label: 'Boarding Gate',      short: 'GATE',     tone: 'sky' },
    { value: 'checkin',  label: 'Check-in',           short: 'CHECK-IN', tone: 'emerald' },
    { value: 'umum',     label: 'Umum',               short: 'UMUM',     tone: 'slate' },
];

const TONE_MAP: Record<string, { chip: string; stripe: string; iconBg: string }> = {
    fuchsia: { chip: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-200', stripe: 'from-fuchsia-500 to-pink-500',     iconBg: 'bg-gradient-to-br from-fuchsia-500 to-pink-500' },
    sky:     { chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',                 stripe: 'from-sky-500 to-cyan-500',         iconBg: 'bg-gradient-to-br from-sky-500 to-cyan-500' },
    emerald: { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200', stripe: 'from-emerald-500 to-teal-500',     iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500' },
    slate:   { chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',            stripe: 'from-slate-400 to-zinc-400',       iconBg: 'bg-gradient-to-br from-slate-500 to-zinc-500' },
};

const JENIS_STREAM_OPTIONS = [
    { value: 'iframe',  label: 'IFrame URL (HLS / web stream)', icon: MonitorIcon },
    { value: 'mjpeg',   label: 'MJPEG (URL gambar streaming)',  icon: ImageIcon },
    { value: 'youtube', label: 'YouTube Live',                  icon: Film },
];

function youtubeEmbed(url: string): string {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.replace('/', '');
            return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1`;
        }
        if (u.hostname.includes('youtube.com')) {
            if (u.pathname.startsWith('/embed/')) return url;
            const id = u.searchParams.get('v');
            if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1`;
            if (u.pathname.startsWith('/live/')) {
                const id2 = u.pathname.split('/')[2];
                return `https://www.youtube.com/embed/${id2}?autoplay=1&mute=1&controls=0&playsinline=1`;
            }
        }
    } catch { /* fallthrough */ }
    return url;
}

function grupOf(g: string) {
    return GRUP_OPTIONS.find((o) => o.value === g) ?? { value: g, label: g, short: g.toUpperCase(), tone: 'slate' };
}

function jenisIconOf(j: 'iframe' | 'mjpeg' | 'youtube') {
    if (j === 'mjpeg') return ImageIcon;
    if (j === 'youtube') return Film;
    return MonitorIcon;
}

function CamPreviewModal({ cam, onClose }: { cam: Cam; onClose: () => void }) {
    const isRtsp = /^rtsp:\/\//i.test(cam.url_stream);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden ring-1 ring-fuchsia-500/30" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-600/85 backdrop-blur text-white text-xs font-semibold tracking-wider">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            LIVE
                        </div>
                        <h3 className="font-semibold">{cam.nama}</h3>
                        {cam.lokasi && <span className="text-xs text-white/50">— {cam.lokasi}</span>}
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded">
                        <X size={18} />
                    </button>
                </div>

                <div className="aspect-video bg-black flex items-center justify-center">
                    {isRtsp ? (
                        <div className="flex flex-col items-center justify-center text-amber-300 text-center px-6">
                            <AlertTriangle size={42} />
                            <p className="mt-3 text-sm font-semibold uppercase tracking-wider">URL RTSP tidak bisa diputar di browser</p>
                            <p className="mt-2 text-xs text-amber-200/80 max-w-md">
                                Browser modern tidak mendukung RTSP secara langsung. Gunakan gateway seperti
                                <span className="mx-1 px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-100 text-[11px]">go2rtc</span>
                                atau
                                <span className="mx-1 px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-100 text-[11px]">MediaMTX</span>
                                untuk mengkonversi RTSP → HLS/WebRTC, lalu masukkan URL HLS/iframe ke kolom URL.
                            </p>
                            <p className="mt-3 text-[11px] text-white/50 break-all font-mono">{cam.url_stream}</p>
                        </div>
                    ) : cam.jenis_stream === 'mjpeg' ? (
                        <img src={cam.url_stream} alt={cam.nama} className="w-full h-full object-contain" />
                    ) : cam.jenis_stream === 'youtube' ? (
                        <iframe src={youtubeEmbed(cam.url_stream)} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                    ) : (
                        <iframe src={cam.url_stream} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                    )}
                </div>

                <div className="px-5 py-3 border-t border-white/10 text-xs text-white/60 flex items-center justify-between gap-3">
                    <div className="font-mono truncate">{cam.url_stream}</div>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 uppercase tracking-wider">{cam.jenis_stream}</span>
                </div>
            </div>
        </div>
    );
}

export default function Index({ cameras, baggageClaims }: { cameras: Cam[]; baggageClaims: BaggageClaimOption[] }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Cam | null>(null);
    const [previewing, setPreviewing] = useState<Cam | null>(null);
    const [query, setQuery] = useState('');
    const [grupFilter, setGrupFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama: '',
        lokasi: '',
        grup: 'baggage',
        baggage_claim_id: '' as number | '',
        jenis_stream: 'iframe' as 'iframe' | 'mjpeg' | 'youtube',
        url_stream: '',
        aktif: true,
        urutan: 0,
    });

    const stats = useMemo(() => {
        const active = cameras.filter((c) => c.aktif).length;
        const baggage = cameras.filter((c) => c.grup === 'baggage').length;
        const youtube = cameras.filter((c) => c.jenis_stream === 'youtube').length;
        return { total: cameras.length, active, baggage, youtube };
    }, [cameras]);

    const filtered = useMemo(() => {
        return cameras.filter((c) => {
            if (grupFilter !== 'all' && c.grup !== grupFilter) return false;
            if (statusFilter === 'active' && !c.aktif) return false;
            if (statusFilter === 'inactive' && c.aktif) return false;
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                c.nama.toLowerCase().includes(q)
                || (c.lokasi || '').toLowerCase().includes(q)
                || c.url_stream.toLowerCase().includes(q)
            );
        });
    }, [cameras, query, grupFilter, statusFilter]);

    const openCreate = () => {
        setEditing(null);
        reset();
        setData({ nama: '', lokasi: '', grup: 'baggage', baggage_claim_id: '', jenis_stream: 'iframe', url_stream: '', aktif: true, urutan: 0 });
        setOpen(true);
    };

    const openEdit = (cam: Cam) => {
        setEditing(cam);
        setData({
            nama: cam.nama,
            lokasi: cam.lokasi || '',
            grup: cam.grup,
            baggage_claim_id: cam.baggage_claim_id ?? '',
            jenis_stream: cam.jenis_stream,
            url_stream: cam.url_stream,
            aktif: cam.aktif,
            urutan: cam.urutan,
        });
        setOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.cctv-cameras.update', editing.id), {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            });
        } else {
            post(route('admin.cctv-cameras.store'), {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            });
        }
    };

    const destroy = async (cam: Cam) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Kamera',
            message: `Apakah Anda yakin ingin menghapus kamera "${cam.nama}"? Tindakan ini tidak dapat dibatalkan.`,
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        router.delete(route('admin.cctv-cameras.destroy', cam.id), { preserveScroll: true });
    };

    const toggleActive = (cam: Cam) => {
        router.put(route('admin.cctv-cameras.update', cam.id), {
            nama: cam.nama,
            lokasi: cam.lokasi,
            grup: cam.grup,
            baggage_claim_id: cam.baggage_claim_id,
            jenis_stream: cam.jenis_stream,
            url_stream: cam.url_stream,
            urutan: cam.urutan,
            aktif: !cam.aktif,
        }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Kamera CCTV</h2>
            }
        >
            <Head title="Kamera CCTV" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* HERO */}
                    <div className="relative overflow-hidden rounded-3xl shadow-xl border border-white/10 bg-gradient-to-br from-fuchsia-600 via-purple-700 to-slate-900 text-white">
                        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-pink-400/30 blur-3xl" />
                        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-violet-400/30 blur-3xl" />
                        <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
                            backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px',
                        }} />
                        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-6 p-8 lg:p-10 items-center">
                            <div className="lg:col-span-3 space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 text-[11px] font-bold uppercase tracking-[0.2em]">
                                    <Sparkles size={12} /> Kamera CCTV Studio
                                </div>
                                <h3 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">
                                    Kelola Live Camera FIDS
                                </h3>
                                <p className="text-base lg:text-lg text-white/85 max-w-2xl">
                                    Daftarkan dan kelola kamera live untuk monitor publik, area bagasi, gate, dan check-in.
                                    Pratinjau langsung sebelum disebar ke layar publik.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={openCreate}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-fuchsia-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                                    >
                                        <Plus size={18} /> Tambah Kamera
                                    </button>
                                    <a
                                        href="/public/cctv/baggage"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/25 text-white font-semibold hover:bg-white/20 transition"
                                    >
                                        <ExternalLink size={16} /> Layar Bagasi
                                    </a>
                                </div>
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
                                <StatChip label="Total" value={stats.total} icon={<Camera size={16} />} />
                                <StatChip label="Aktif" value={stats.active} icon={<Wifi size={16} />} />
                                <StatChip label="Bagasi" value={stats.baggage} icon={<Layers size={16} />} />
                                <StatChip label="YouTube" value={stats.youtube} icon={<Film size={16} />} />
                            </div>
                        </div>
                    </div>

                    {/* TOOLBAR */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama, lokasi, atau URL kamera..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-fuchsia-500 focus:ring focus:ring-fuchsia-500/20"
                            />
                        </div>

                        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 overflow-x-auto">
                            <FilterPill active={grupFilter === 'all'} onClick={() => setGrupFilter('all')}>Semua Grup</FilterPill>
                            {GRUP_OPTIONS.map((g) => (
                                <FilterPill key={g.value} active={grupFilter === g.value} onClick={() => setGrupFilter(g.value)}>
                                    {g.short}
                                </FilterPill>
                            ))}
                        </div>

                        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700">
                            <FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Semua</FilterPill>
                            <FilterPill active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>Aktif</FilterPill>
                            <FilterPill active={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')}>Mati</FilterPill>
                        </div>
                    </div>

                    {/* CARDS */}
                    {filtered.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-900/30 flex items-center justify-center mx-auto mb-4">
                                <Camera size={28} className="text-fuchsia-500" />
                            </div>
                            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                {cameras.length === 0 ? 'Belum ada kamera' : 'Tidak ada hasil'}
                            </h5>
                            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                                {cameras.length === 0
                                    ? 'Klik "Tambah Kamera" untuk mendaftarkan kamera live pertama Anda.'
                                    : 'Coba ubah kata kunci pencarian atau filter.'}
                            </p>
                            {cameras.length === 0 && (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-fuchsia-600 text-white text-sm font-bold hover:bg-fuchsia-700 transition shadow"
                                >
                                    <Plus size={16} /> Tambah Kamera
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filtered.map((cam) => (
                                <CameraCard
                                    key={cam.id}
                                    cam={cam}
                                    onEdit={() => openEdit(cam)}
                                    onDelete={() => destroy(cam)}
                                    onPreview={() => setPreviewing(cam)}
                                    onToggle={() => toggleActive(cam)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={submit}>
                            {/* Modal Header with gradient */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white px-6 py-5">
                                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-pink-300/30 blur-2xl" />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur ring-1 ring-white/30 flex items-center justify-center">
                                            <Camera size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black tracking-tight">
                                                {editing ? 'Edit Kamera' : 'Tambah Kamera'}
                                            </h3>
                                            <p className="text-[11px] uppercase tracking-widest text-white/80 font-semibold">
                                                {editing ? 'Perbarui konfigurasi stream' : 'Daftarkan kamera live baru'}
                                            </p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setOpen(false)} className="text-white/80 hover:text-white p-1 rounded">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="nama" value="Nama Kamera" />
                                    <TextInput id="nama" className="mt-1 w-full" value={data.nama} onChange={(e: any) => setData('nama', e.target.value)} required placeholder="Mis. CCTV Bagasi 1" />
                                    <InputError message={errors.nama} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="lokasi" value="Lokasi" />
                                    <TextInput id="lokasi" className="mt-1 w-full" value={data.lokasi} onChange={(e: any) => setData('lokasi', e.target.value)} placeholder="Mis. Belt 1, Lobby Bagasi" />
                                    <InputError message={errors.lokasi} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="urutan" value="Urutan" />
                                    <TextInput id="urutan" type="number" min={0} className="mt-1 w-full" value={data.urutan} onChange={(e: any) => setData('urutan', parseInt(e.target.value) || 0)} />
                                    <InputError message={errors.urutan} className="mt-1" />
                                </div>

                                <div className="md:col-span-2">
                                    <InputLabel value="Grup Layar" />
                                    <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {GRUP_OPTIONS.map((g) => {
                                            const tone = TONE_MAP[g.tone];
                                            const active = data.grup === g.value;
                                            return (
                                                <button
                                                    type="button"
                                                    key={g.value}
                                                    onClick={() => setData('grup', g.value)}
                                                    className={`px-2 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest border transition text-center ${
                                                        active
                                                            ? `border-fuchsia-500 ring-2 ring-fuchsia-500/30 ${tone.chip}`
                                                            : `border-gray-200 dark:border-gray-700 ${tone.chip} hover:opacity-80`
                                                    }`}
                                                >
                                                    {g.short}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.grup} className="mt-1" />
                                </div>

                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="baggage_claim_id" value="Belt Bagasi (untuk grup Bagasi)" />
                                    <select
                                        id="baggage_claim_id"
                                        className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 disabled:opacity-50"
                                        value={data.baggage_claim_id === '' ? '' : String(data.baggage_claim_id)}
                                        onChange={(e) => setData('baggage_claim_id', e.target.value === '' ? '' : parseInt(e.target.value))}
                                        disabled={data.grup !== 'baggage'}
                                    >
                                        <option value="">— Pilih Belt —</option>
                                        {baggageClaims.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                Belt {b.nomor_belt}{b.terminal ? ` • ${b.terminal}` : ''}{b.area ? ` • ${b.area}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                        Layar otomatis menampilkan iklan saat tidak ada penerbangan tiba di belt ini.
                                    </p>
                                    <InputError message={errors.baggage_claim_id} className="mt-1" />
                                </div>

                                <div className="md:col-span-2">
                                    <InputLabel value="Jenis Stream" />
                                    <div className="mt-1 grid grid-cols-3 gap-2">
                                        {JENIS_STREAM_OPTIONS.map(({ value, label, icon: Icon }) => {
                                            const active = data.jenis_stream === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setData('jenis_stream', value as any)}
                                                    className={`p-3 rounded-lg border text-left transition ${
                                                        active
                                                            ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/30 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <Icon size={18} className={active ? 'text-fuchsia-600' : 'text-gray-400'} />
                                                    <p className={`mt-1 text-[10px] font-black uppercase tracking-widest ${active ? 'text-fuchsia-700 dark:text-fuchsia-200' : 'text-gray-600 dark:text-gray-300'}`}>
                                                        {value}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{label}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.jenis_stream} className="mt-1" />
                                </div>

                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="url_stream" value="URL Stream" />
                                    <TextInput id="url_stream" className="mt-1 w-full font-mono text-xs" value={data.url_stream} onChange={(e: any) => setData('url_stream', e.target.value)} required placeholder="https://..." />
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                        Contoh: <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-mono">http://192.168.1.10:8080/video</code> (MJPEG), URL embed dari NVR (iframe), atau link YouTube Live.
                                    </p>
                                    <InputError message={errors.url_stream} className="mt-1" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="flex items-center justify-between p-3 rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            {data.aktif ? <Power size={18} className="text-emerald-500" /> : <PowerOff size={18} className="text-gray-400" />}
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Aktifkan kamera ini</p>
                                                <p className="text-[11px] text-gray-500">Saat aktif, kamera akan tampil di layar publik FIDS</p>
                                            </div>
                                        </div>
                                        <input type="checkbox" className="rounded border-gray-300 text-fuchsia-600 w-5 h-5" checked={data.aktif} onChange={(e) => setData('aktif', e.target.checked)} />
                                    </label>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Batal</button>
                                <PrimaryButton disabled={processing}>{editing ? 'Perbarui' : 'Simpan'}</PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {previewing && (
                <CamPreviewModal cam={previewing} onClose={() => setPreviewing(null)} />
            )}
        </AuthenticatedLayout>
    );
}

function StatChip({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20 px-4 py-3">
            <div className="flex items-center gap-2 text-white/80 text-[10px] uppercase tracking-[0.2em] font-bold">
                {icon}
                {label}
            </div>
            <div className="mt-1 text-2xl font-black tabular-nums">{value}</div>
        </div>
    );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                active
                    ? 'bg-white dark:bg-gray-700 text-fuchsia-700 dark:text-fuchsia-200 shadow'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
        >
            {children}
        </button>
    );
}

function CameraCard({
    cam, onEdit, onDelete, onPreview, onToggle,
}: {
    cam: Cam;
    onEdit: () => void;
    onDelete: () => void;
    onPreview: () => void;
    onToggle: () => void;
}) {
    const grup = grupOf(cam.grup);
    const tone = TONE_MAP[grup.tone];
    const StreamIcon = jenisIconOf(cam.jenis_stream);
    const isRtsp = /^rtsp:\/\//i.test(cam.url_stream);
    // Kamera bagasi kini menyatu dengan layar baggage claim: tombol "Lihat"
    // mengarah ke halaman belt-nya sendiri (yang otomatis menampilkan kamera).
    const beltUrl = cam.grup === 'baggage' && cam.baggage_claim
        ? `/public/gate/baggageclaim/details?id=belt-${cam.baggage_claim.nomor_belt}`
        : null;

    return (
        <div className="group relative rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-fuchsia-300 dark:hover:ring-fuchsia-500 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden">
            {/* status stripe */}
            <div className={`h-1 w-full bg-gradient-to-r ${cam.aktif ? tone.stripe : 'from-slate-300 to-zinc-300'}`} />

            {/* preview area */}
            <div className="relative aspect-video bg-slate-900 overflow-hidden">
                {/* faux CCTV view */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.7) 0 1px, transparent 1px 4px)',
                }} />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                    <Camera size={42} className={cam.aktif ? 'text-fuchsia-400/70' : 'text-white/20'} />
                    <span className="mt-2 text-[10px] uppercase tracking-widest font-bold">{cam.jenis_stream}</span>
                </div>

                {/* live/off badge */}
                <div className="absolute top-2 left-2 z-10">
                    {cam.aktif ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/85 backdrop-blur text-white text-[10px] font-black tracking-widest uppercase">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                            </span>
                            LIVE
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-700/85 backdrop-blur text-gray-200 text-[10px] font-black tracking-widest uppercase">
                            <PowerOff size={11} />
                            OFFLINE
                        </div>
                    )}
                </div>

                {/* grup chip */}
                <div className="absolute top-2 right-2 z-10">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${tone.chip}`}>
                        {grup.short}
                    </span>
                </div>

                {/* order */}
                <div className="absolute bottom-2 left-2 z-10">
                    <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-black/70 backdrop-blur text-white text-[11px] font-black tabular-nums">
                        <Hash size={10} className="mr-0.5" />{cam.urutan}
                    </span>
                </div>

                {/* hover actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition flex items-end justify-center p-3 gap-2 z-20">
                    {beltUrl ? (
                        <a
                            href={beltUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-md bg-white/95 text-fuchsia-700 hover:bg-white text-xs font-bold flex items-center gap-1.5"
                            title="Buka layar baggage claim (belt)"
                        >
                            <Eye size={13} /> Lihat
                        </a>
                    ) : (
                        <button
                            onClick={onPreview}
                            className="px-3 py-1.5 rounded-md bg-white/95 text-fuchsia-700 hover:bg-white text-xs font-bold flex items-center gap-1.5"
                            title="Pratinjau"
                        >
                            <Eye size={13} /> Lihat
                        </button>
                    )}
                    <a
                        href={`/public/cctv/baggage/details?id=${cam.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-md bg-white/95 text-emerald-700 hover:bg-white text-xs font-bold flex items-center gap-1.5"
                        title="Buka di tab baru"
                    >
                        <ExternalLink size={13} /> Single
                    </a>
                    <button
                        onClick={onToggle}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 ${
                            cam.aktif ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                        title={cam.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                        {cam.aktif ? <PowerOff size={12} /> : <Power size={12} />}
                        {cam.aktif ? 'Off' : 'On'}
                    </button>
                </div>
            </div>

            {/* body */}
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <h5 className="text-sm font-bold text-gray-900 dark:text-white leading-snug truncate">{cam.nama}</h5>
                        {cam.lokasi && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5 truncate">
                                <MapPin size={11} className="shrink-0" /> <span className="truncate">{cam.lokasi}</span>
                            </div>
                        )}
                    </div>
                    {cam.baggage_claim && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            BELT {cam.baggage_claim.nomor_belt}
                        </span>
                    )}
                </div>

                {/* stream meta */}
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider">
                        <StreamIcon size={11} /> {cam.jenis_stream}
                    </span>
                    {isRtsp && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-bold">
                            <AlertTriangle size={11} /> RTSP
                        </span>
                    )}
                </div>

                {/* URL */}
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 ring-1 ring-gray-100 dark:ring-gray-700 px-2.5 py-1.5 text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate" title={cam.url_stream}>
                    {cam.url_stream}
                </div>

                {/* actions */}
                <div className="flex items-center gap-2 pt-1">
                    <button
                        onClick={onEdit}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-600 hover:text-white transition border border-fuchsia-100 dark:bg-fuchsia-900/30 dark:text-fuchsia-200 dark:border-fuchsia-700/40"
                    >
                        <Pencil size={12} /> Edit
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
