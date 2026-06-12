import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Plus, Edit2, Trash2, Send, X, Volume2, Globe, Target, AlertTriangle, Terminal, Repeat, Timer, Headphones } from 'lucide-react';
import { announce } from '@/lib/announcer';
import { appConfirm } from '@/lib/confirm';

interface Announcement {
    id: number;
    judul: string;
    isi_pengumuman: string;
    bahasa: string;
    target: string;
    mode: string;
    tipe: string;
    broadcast_count: number;
    max_broadcasts: number;
    interval_pemutaran: number;
}

interface Props {
    announcements: {
        data: Announcement[];
        links: any[];
        total: number;
    };
    missingDependencies: string[];
}

export default function Index({ announcements, missingDependencies = [] }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        judul: '',
        isi_pengumuman: '',
        bahasa: 'Indonesia',
        target: 'All Public Displays',
        mode: 'Manual',
        max_broadcasts: 3,
        interval_pemutaran: 4,
    });

    const openModal = (ann?: Announcement) => {
        if (ann) {
            setEditingAnn(ann);
            setData({
                judul: ann.judul,
                isi_pengumuman: ann.isi_pengumuman,
                bahasa: ann.bahasa,
                target: ann.target,
                mode: ann.mode,
                max_broadcasts: ann.max_broadcasts,
                interval_pemutaran: ann.interval_pemutaran,
            });
        } else {
            setEditingAnn(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAnn(null);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAnn) {
            put(route('admin.public-announcements.update', editingAnn.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.public-announcements.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Pengumuman',
            message: 'Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        router.delete(route('admin.public-announcements.destroy', id), {
            preserveScroll: true,
            preserveState: false,
            onError: (errors) => {
                console.error('Delete failed', errors);
                // jika 404, mungkin sudah terhapus oleh auto-delete -> reload list
                router.reload({ only: ['announcements'] });
            },
        });
    };

    const handleBroadcast = (ann: Announcement) => {
        router.post(route('admin.public-announcements.broadcast', ann.id));
    };

    const handleTest = async (ann: Announcement) => {
        const text = String(ann.isi_pengumuman ?? '').replace(/---/g, '. ');
        await announce(text, { lang: ann.bahasa?.toLowerCase().startsWith('eng') ? 'en-US' : 'id-ID', rate: 0.92 });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Public Announcement (PAS)
                </h2>
            }
        >
            <Head title="Public Announcement" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Dependency Warning */}
                    {missingDependencies.length > 0 && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex gap-4">
                                <div className="bg-amber-500 p-2 rounded-lg h-fit text-white">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-lg font-bold text-amber-800 mb-1">Dependensi Linux Belum Lengkap!</h3>
                                    <p className="text-amber-700 text-sm mb-4">
                                        Untuk menjalankan pengumuman suara otomatis di server Linux, Anda perlu menginstal paket berikut:
                                        <span className="font-bold ml-1">{missingDependencies.join(', ')}</span>.
                                    </p>
                                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-emerald-400 border border-white/10 shadow-inner group relative">
                                        <div className="flex items-center gap-2 mb-2 text-white/40">
                                            <Terminal size={12} />
                                            <span>Jalankan perintah ini di terminal server:</span>
                                        </div>
                                        <p>sudo apt-get update</p>
                                        <p>sudo apt-get install -y espeak alsa-utils</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hero / Intro */}
                    <div className="relative overflow-hidden rounded-3xl shadow-xl border border-white/10 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white">
                        {/* glowing orbs */}
                        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-pink-400/30 blur-3xl" />
                        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-violet-400/30 blur-3xl" />
                        {/* mesh dots */}
                        <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
                            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                            backgroundSize: '18px 18px',
                        }} />

                        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-6 p-8 lg:p-10 items-center">
                            <div className="lg:col-span-3 space-y-5">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 text-[11px] font-bold uppercase tracking-[0.2em]">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                    </span>
                                    Public Address System
                                </div>
                                <h3 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">
                                    Komunikasi Operasional Bandara
                                </h3>
                                <p className="text-base lg:text-lg leading-relaxed text-white/85 max-w-2xl">
                                    Atur pengumuman publik dengan suara otomatis, didahului bunyi nada dua khas bandara.
                                    Kelola bahasa, target area, dan jadwal pemutaran dalam satu tempat.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => openModal()}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-fuchsia-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                                    >
                                        <Plus size={18} /> Buat Pengumuman
                                    </button>
                                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/20 text-xs font-semibold">
                                        <Volume2 size={14} /> {announcements.total} pengumuman terdaftar
                                    </span>
                                </div>
                            </div>

                            {/* Visual: speaker card */}
                            <div className="lg:col-span-2">
                                <div className="relative rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/25 p-5 shadow-2xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
                                            <Volume2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Now Broadcasting</p>
                                            <p className="text-sm font-bold">PAS Voice Engine</p>
                                        </div>
                                        <div className="ml-auto px-2 py-1 rounded-full bg-emerald-400/20 text-emerald-100 text-[10px] font-black uppercase tracking-wider ring-1 ring-emerald-300/30">
                                            ONLINE
                                        </div>
                                    </div>

                                    {/* equalizer animation */}
                                    <div className="rounded-xl bg-black/30 backdrop-blur-sm p-4 ring-1 ring-white/10">
                                        <div className="flex items-end justify-center gap-1.5 h-14">
                                            {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => (
                                                <span
                                                    key={i}
                                                    className="w-1.5 rounded-full bg-gradient-to-t from-fuchsia-400 to-pink-200"
                                                    style={{
                                                        animation: `eq-bounce 1.${(i % 6) + 2}s ease-in-out ${i * 0.07}s infinite alternate`,
                                                        height: '30%',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                        <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-2">
                                            <p className="text-[9px] uppercase tracking-wider text-white/60">Bahasa</p>
                                            <p className="text-sm font-black mt-0.5">2</p>
                                        </div>
                                        <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-2">
                                            <p className="text-[9px] uppercase tracking-wider text-white/60">Voices</p>
                                            <p className="text-sm font-black mt-0.5">HD</p>
                                        </div>
                                        <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-2">
                                            <p className="text-[9px] uppercase tracking-wider text-white/60">Chime</p>
                                            <p className="text-sm font-black mt-0.5">2-Tone</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <style>{`
                            @keyframes eq-bounce { from { height: 18%; } to { height: 95%; } }
                        `}</style>
                    </div>

                    {/* List Section */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center">
                                    <Volume2 size={16} className="text-fuchsia-600 dark:text-fuchsia-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">Daftar Pengumuman PAS</h4>
                                    <p className="text-xs text-gray-500">{announcements.total} aktif & terjadwal</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => openModal()}
                                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-200 text-xs font-bold hover:bg-fuchsia-100"
                            >
                                <Plus size={14} /> Tambah
                            </button>
                        </div>
                        <div className="p-5">
                            {announcements.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {announcements.data.map((item) => {
                                        const sisa = Math.max(0, item.max_broadcasts - item.broadcast_count);
                                        const progress = item.max_broadcasts > 0
                                            ? Math.min(100, Math.round((item.broadcast_count / item.max_broadcasts) * 100))
                                            : 0;
                                        const isAuto = item.mode === 'Automatic';
                                        return (
                                            <div
                                                key={item.id}
                                                className="relative group rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-fuchsia-300 dark:hover:ring-fuchsia-500 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
                                            >
                                                {/* color stripe */}
                                                <div className={`h-1 w-full ${isAuto ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} />

                                                <div className="p-5 space-y-4">
                                                    {/* Header: title + mode */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <h5 className="text-sm font-bold text-gray-900 dark:text-white leading-snug truncate">{item.judul}</h5>
                                                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{item.isi_pengumuman}</p>
                                                        </div>
                                                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                            isAuto
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                        }`}>
                                                            {item.mode}
                                                        </span>
                                                    </div>

                                                    {/* Meta chips */}
                                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
                                                            <Globe size={11} /> {item.bahasa}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-semibold">
                                                            <Target size={11} /> {item.target}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold">
                                                            <Timer size={11} /> {item.interval_pemutaran}m
                                                        </span>
                                                    </div>

                                                    {/* Progress */}
                                                    <div>
                                                        <div className="flex items-center justify-between text-[11px] mb-1">
                                                            <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 font-semibold">
                                                                <Repeat size={11} className="text-indigo-500" /> Sisa pemutaran
                                                            </span>
                                                            <span className="font-black text-gray-900 dark:text-white tabular-nums">
                                                                {sisa}<span className="text-gray-400 font-bold"> / {item.max_broadcasts}</span>
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 transition-all"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <button
                                                            onClick={() => handleTest(item)}
                                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-600 hover:text-white transition border border-fuchsia-100 dark:bg-fuchsia-900/30 dark:text-fuchsia-200 dark:border-fuchsia-700/40"
                                                            title="Putar suara di browser"
                                                        >
                                                            <Headphones size={12} /> Test
                                                        </button>
                                                        <button
                                                            onClick={() => handleBroadcast(item)}
                                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                                                        >
                                                            <Send size={12} /> Kirim
                                                        </button>
                                                        <button
                                                            onClick={() => openModal(item)}
                                                            className="p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-900/30 flex items-center justify-center mb-4">
                                        <Volume2 size={28} className="text-fuchsia-500" />
                                    </div>
                                    <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">Belum ada pengumuman</h5>
                                    <p className="text-sm text-gray-500 mt-1 max-w-xs">
                                        Klik "Buat Pengumuman" untuk menambahkan announcement publik pertama Anda.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => openModal()}
                                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-fuchsia-600 text-white text-sm font-bold hover:bg-fuchsia-700 transition shadow"
                                    >
                                        <Plus size={16} /> Buat Pengumuman
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={isModalOpen} onClose={closeModal}>
                <form onSubmit={submit} className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {editingAnn ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                        </h2>
                        <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="judul" value="Judul Pengumuman" />
                            <TextInput
                                id="judul"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.judul}
                                onChange={(e) => setData('judul', e.target.value)}
                                required
                                placeholder="Contoh: Boarding Call Final"
                            />
                            <InputError message={errors.judul} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="bahasa" value="Bahasa" />
                                <select
                                    id="bahasa"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-blue-500 dark:focus:border-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600 rounded-md shadow-sm"
                                    value={data.bahasa}
                                    onChange={(e) => setData('bahasa', e.target.value)}
                                >
                                    <option value="Indonesia">Indonesia</option>
                                    <option value="English">English</option>
                                    <option value="Mandarin">Mandarin</option>
                                </select>
                                <InputError message={errors.bahasa} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="mode" value="Mode Siaran" />
                                <select
                                    id="mode"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-blue-500 dark:focus:border-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600 rounded-md shadow-sm"
                                    value={data.mode}
                                    onChange={(e) => setData('mode', e.target.value)}
                                >
                                    <option value="Manual">Manual</option>
                                    <option value="Automatic">Automatic</option>
                                </select>
                                <InputError message={errors.mode} className="mt-2" />
                            </div>
                        </div>

                        {/* Playback Rules */}
                        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
                            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Repeat size={12} /> Aturan Pemutaran
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="max_broadcasts" value="Jumlah Pemutaran (x)" />
                                    <TextInput
                                        id="max_broadcasts"
                                        type="number"
                                        min={1}
                                        max={99}
                                        className="mt-1 block w-full"
                                        value={data.max_broadcasts}
                                        onChange={(e) => setData('max_broadcasts', parseInt(e.target.value) || 1)}
                                        required
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">*Otomatis terhapus setelah selesai</p>
                                    <InputError message={errors.max_broadcasts} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="interval_pemutaran" value="Interval Antar Pemutaran (menit)" />
                                    <TextInput
                                        id="interval_pemutaran"
                                        type="number"
                                        min={1}
                                        max={60}
                                        className="mt-1 block w-full"
                                        value={data.interval_pemutaran}
                                        onChange={(e) => setData('interval_pemutaran', parseInt(e.target.value) || 1)}
                                        required
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">*Jeda antar ulangan</p>
                                    <InputError message={errors.interval_pemutaran} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="target" value="Target Area / Display" />
                            <TextInput
                                id="target"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.target}
                                onChange={(e) => setData('target', e.target.value)}
                                required
                                placeholder="Contoh: Gate A3 atau All Public Displays"
                            />
                            <InputError message={errors.target} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="isi_pengumuman" value="Isi Pengumuman (Teks untuk Suara/Display)" />
                            <textarea
                                id="isi_pengumuman"
                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-blue-500 dark:focus:border-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600 rounded-md shadow-sm min-h-[120px]"
                                value={data.isi_pengumuman}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^[a-zA-Z0-9\s,\.]+$/u.test(val)) {
                                        setData('isi_pengumuman', val);
                                    }
                                }}
                                required
                            />
                            <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 italic">
                                *Hanya diperbolehkan huruf, angka, spasi, koma (,), dan titik (.).
                            </p>
                            <InputError message={errors.isi_pengumuman} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                            {editingAnn ? 'Simpan Perubahan' : 'Buat Pengumuman'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
