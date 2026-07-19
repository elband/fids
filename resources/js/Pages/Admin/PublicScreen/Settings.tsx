import { useForm, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import {
    Monitor, LayoutGrid, Columns, Square, Eye, EyeOff, ExternalLink, Tv,
    Sparkles, Image as ImageIcon, Save, RefreshCw, Palette, PlaneTakeoff, PlaneLanding, CloudSun,
    Type, Megaphone, Gauge, Building2,
} from 'lucide-react';
import { appConfirm } from '@/lib/confirm';

interface DisplaySetting {
    id: number;
    mode_default: 'single' | '2-column' | '3-column';
    tema_warna: string;
    warna_utama: string;
    warna_aksen: string;
    show_departures: boolean;
    show_arrivals: boolean;
    tampilkan_cuaca: boolean;
    show_advertisement: boolean;
    background_header: string | null;
    nama_bandara: string | null;
    kecepatan_scroll: number | null;
    teks_ticker: string | null;
}

const LAYOUT_OPTIONS = [
    { value: 'single',    label: '1 Kolom',  icon: Square,     desc: 'Satu informasi penuh' },
    { value: '2-column',  label: '2 Kolom',  icon: Columns,    desc: 'Berangkat + Datang' },
    { value: '3-column',  label: '3 Kolom',  icon: LayoutGrid, desc: 'Plus Cuaca' },
] as const;

const THEME_COLORS = [
    { value: '#0f172a', label: 'Navy' },
    { value: '#1e1b4b', label: 'Indigo' },
    { value: '#052e16', label: 'Hutan' },
    { value: '#450a0a', label: 'Merah' },
    { value: '#1c1917', label: 'Coklat' },
    { value: '#000000', label: 'Hitam' },
    { value: '#0c0a25', label: 'Ungu Gelap' },
    { value: '#0b1320', label: 'Slate' },
];

const TEXT_COLORS = [
    { value: '#ffffff', label: 'Putih' },
    { value: '#fbbf24', label: 'Emas' },
    { value: '#facc15', label: 'Kuning' },
    { value: '#38bdf8', label: 'Biru' },
    { value: '#4ade80', label: 'Hijau' },
    { value: '#f87171', label: 'Merah' },
    { value: '#e2e8f0', label: 'Abu' },
    { value: '#000000', label: 'Hitam' },
];

const SECTIONS: Array<{
    key: 'show_departures' | 'show_arrivals' | 'tampilkan_cuaca' | 'show_advertisement';
    label: string;
    icon: any;
    desc: string | null;
    accent: string;
}> = [
    { key: 'show_departures',    label: 'Keberangkatan',  icon: PlaneTakeoff, desc: 'Tabel jadwal penerbangan berangkat', accent: 'sky' },
    { key: 'show_arrivals',      label: 'Kedatangan',     icon: PlaneLanding, desc: 'Tabel jadwal penerbangan datang',    accent: 'emerald' },
    { key: 'tampilkan_cuaca',    label: 'Cuaca',          icon: CloudSun,     desc: 'Suhu & kondisi cuaca real-time',      accent: 'amber' },
    { key: 'show_advertisement', label: 'Advertisement',  icon: Tv,           desc: null,                                  accent: 'fuchsia' },
];

export default function Settings({ setting, adCount = 0 }: PageProps<{ setting: DisplaySetting | null; adCount: number }>) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        mode_default:       setting?.mode_default       || '2-column',
        tema_warna:         setting?.tema_warna         || '#0f172a',
        warna_utama:        setting?.warna_utama        || '#ffffff',
        warna_aksen:        setting?.warna_aksen        || '#fbbf24',
        show_departures:    setting?.show_departures    ?? true,
        show_arrivals:      setting?.show_arrivals      ?? true,
        tampilkan_cuaca:    setting?.tampilkan_cuaca    ?? true,
        show_advertisement: setting?.show_advertisement ?? false,
        background_header:  null as File | null,
        remove_background:  false,
        nama_bandara:       (setting as any)?.nama_bandara || '',
        kecepatan_scroll:   (setting as any)?.kecepatan_scroll || 1,
        teks_ticker:        (setting as any)?.teks_ticker || '',
        _method:            'POST',
    });

    const [bgPreview, setBgPreview] = useState<string | null>(null);

    useEffect(() => {
        if (data.background_header) {
            const url = URL.createObjectURL(data.background_header);
            setBgPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setBgPreview(null);
    }, [data.background_header]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.public-screen-settings.update'), { preserveScroll: true });
    };

    const currentBg = bgPreview || (setting?.background_header ? `/storage/${setting.background_header}` : null);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">Pengaturan TV Layar Publik</h2>
            }
        >
            <Head title="Pengaturan TV Layar Publik" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* HERO */}
                    <div className="relative overflow-hidden rounded-3xl shadow-xl border border-white/10 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white">
                        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-pink-400/30 blur-3xl" />
                        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-violet-400/30 blur-3xl" />
                        <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
                            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                            backgroundSize: '18px 18px',
                        }} />
                        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-6 p-8 lg:p-10 items-center">
                            <div className="lg:col-span-3 space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 text-[11px] font-bold uppercase tracking-[0.2em]">
                                    <Sparkles size={12} /> Display Studio
                                </div>
                                <h3 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">
                                    Atur Layar Publik FIDS
                                </h3>
                                <p className="text-base lg:text-lg leading-relaxed text-white/85 max-w-2xl">
                                    Sesuaikan layout, tema, dan seksi yang tampil di TV bandara.
                                    Preview langsung berubah saat Anda memilih.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <a
                                        href="/public/screen"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-fuchsia-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                                    >
                                        <ExternalLink size={16} /> Buka Layar Publik
                                    </a>
                                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/20 text-xs font-semibold">
                                        <Tv size={14} /> {adCount} iklan aktif
                                    </span>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <PreviewMockup
                                    layout={data.mode_default}
                                    theme={data.tema_warna}
                                    showDep={data.show_departures}
                                    showArr={data.show_arrivals}
                                    showWeather={data.tampilkan_cuaca}
                                    showAd={data.show_advertisement}
                                    backgroundUrl={currentBg}
                                    namaBandara={data.nama_bandara}
                                    teksTicker={data.teks_ticker}
                                />
                            </div>
                        </div>
                    </div>

                    {recentlySuccessful && (
                        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-sm font-medium px-4 py-3 rounded-r-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Save size={16} /> Pengaturan berhasil disimpan.
                        </div>
                    )}

                    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT — settings (2 cols) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Layout Picker */}
                            <SectionCard
                                icon={<LayoutGrid size={18} />}
                                title="Layout Layar"
                                subtitle="Pilih susunan tampilan di TV layar publik"
                                accentClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {LAYOUT_OPTIONS.map(({ value, label, icon: Icon, desc }) => {
                                        const active = data.mode_default === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setData('mode_default', value)}
                                                className={`relative p-4 rounded-2xl border-2 text-left transition-all overflow-hidden ${
                                                    active
                                                        ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20 bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-fuchsia-900/20 dark:to-purple-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-900'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <Icon size={28} className={active ? 'text-fuchsia-600' : 'text-gray-400'} />
                                                    {active && (
                                                        <span className="px-2 py-0.5 rounded-full bg-fuchsia-600 text-white text-[9px] font-black uppercase tracking-widest">
                                                            Aktif
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`font-bold text-sm ${active ? 'text-fuchsia-700 dark:text-fuchsia-200' : 'text-gray-700 dark:text-gray-200'}`}>{label}</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
                                                {/* mini schematic */}
                                                <div className="mt-3 grid gap-1" style={{
                                                    gridTemplateColumns: value === 'single' ? '1fr' : value === '2-column' ? '1fr 1fr' : '1fr 1fr 1fr',
                                                }}>
                                                    {Array.from({ length: value === 'single' ? 1 : value === '2-column' ? 2 : 3 }).map((_, i) => (
                                                        <span key={i} className={`h-6 rounded ${active ? 'bg-fuchsia-300/60' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.mode_default} className="mt-2" />
                            </SectionCard>

                            {/* Sections Toggles */}
                            <SectionCard
                                icon={<Eye size={18} />}
                                title="Tampilkan Seksi"
                                subtitle="Pilih informasi yang ditayangkan"
                                accentClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {SECTIONS.map(({ key, label, desc, icon: Icon, accent }) => {
                                        const isAd = key === 'show_advertisement';
                                        const isOn = (data as any)[key] as boolean;
                                        const displayDesc = isAd
                                            ? `Playlist iklan (${adCount} aktif)`
                                            : desc!;
                                        const accentMap: Record<string, string> = {
                                            sky: 'from-sky-500 to-cyan-500',
                                            emerald: 'from-emerald-500 to-teal-500',
                                            amber: 'from-amber-500 to-orange-500',
                                            fuchsia: 'from-fuchsia-500 to-pink-500',
                                        };
                                        return (
                                            <label
                                                key={key}
                                                className={`group relative cursor-pointer rounded-2xl ring-1 transition overflow-hidden ${
                                                    isOn
                                                        ? 'bg-white dark:bg-gray-900 ring-fuchsia-300 shadow-md'
                                                        : 'bg-gray-50 dark:bg-gray-900/40 ring-gray-200 dark:ring-gray-700'
                                                }`}
                                            >
                                                {/* accent stripe */}
                                                <div className={`h-1 w-full bg-gradient-to-r ${accentMap[accent]} ${isOn ? 'opacity-100' : 'opacity-30'}`} />
                                                <div className="p-4 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                                                            isOn ? `bg-gradient-to-br ${accentMap[accent]} text-white shadow` : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                                        }`}>
                                                            <Icon size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`font-bold text-sm ${isOn ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{label}</p>
                                                            <p className="text-[11px] text-gray-500 truncate">{displayDesc}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); setData(key as any, !isOn); }}
                                                        aria-pressed={isOn}
                                                        className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
                                                            isOn ? `bg-gradient-to-r ${accentMap[accent]}` : 'bg-gray-300 dark:bg-gray-700'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                                                isOn ? 'translate-x-6' : 'translate-x-0.5'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                                {data.show_advertisement && adCount === 0 && (
                                    <div className="mt-3 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/50">
                                        <Tv size={14} />
                                        Belum ada iklan aktif. Tambahkan dulu di Advertisement Management sebelum mengaktifkan fitur ini.
                                    </div>
                                )}
                            </SectionCard>

                            {/* Identitas Layar */}
                            <SectionCard
                                icon={<Building2 size={18} />}
                                title="Identitas Layar"
                                subtitle="Nama bandara yang tampil di header TV publik"
                                accentClass="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300"
                            >
                                <div className="space-y-2">
                                    <label htmlFor="nama_bandara" className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                        <Type size={12} /> Nama Bandara
                                    </label>
                                    <input
                                        id="nama_bandara"
                                        type="text"
                                        value={data.nama_bandara}
                                        onChange={(e) => setData('nama_bandara', e.target.value)}
                                        placeholder="Contoh: SAMS Sepinggan International Airport"
                                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-fuchsia-500 focus:ring focus:ring-fuchsia-500/20"
                                    />
                                    <p className="text-[11px] text-gray-400">Tampil di pojok kanan atas TV layar publik.</p>
                                </div>
                            </SectionCard>

                            {/* Animasi & Kecepatan */}
                            <SectionCard
                                icon={<Gauge size={18} />}
                                title="Animasi & Ticker"
                                subtitle="Kecepatan auto-scroll & teks marquee"
                                accentClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300"
                            >
                                <div className="space-y-5">
                                    <div>
                                        <label htmlFor="kecepatan_scroll" className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-200">
                                            <span className="flex items-center gap-1.5"><Gauge size={12} /> Kecepatan Auto-Scroll Tabel</span>
                                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200 font-black tabular-nums">
                                                {data.kecepatan_scroll}
                                            </span>
                                        </label>
                                        <input
                                            id="kecepatan_scroll"
                                            type="range"
                                            min={1}
                                            max={10}
                                            value={data.kecepatan_scroll}
                                            onChange={(e) => setData('kecepatan_scroll', parseInt(e.target.value) || 1)}
                                            className="mt-2 w-full accent-fuchsia-500"
                                        />
                                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                                            <span>Lambat</span>
                                            <span>Sedang</span>
                                            <span>Cepat</span>
                                        </div>
                                        <InputError message={errors.kecepatan_scroll} className="mt-2" />
                                    </div>

                                    <div>
                                        <label htmlFor="teks_ticker" className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                            <Megaphone size={12} /> Teks Marquee Ticker
                                        </label>
                                        <textarea
                                            id="teks_ticker"
                                            value={data.teks_ticker}
                                            onChange={(e) => setData('teks_ticker', e.target.value)}
                                            rows={2}
                                            placeholder="Selamat datang di Bandara..."
                                            className="mt-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-fuchsia-500 focus:ring focus:ring-fuchsia-500/20"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            Kosongkan untuk menyembunyikan ticker bawah layar publik.
                                        </p>
                                        <InputError message={errors.teks_ticker} className="mt-2" />

                                        {data.teks_ticker && (
                                            <div className="mt-3 rounded-lg bg-slate-900 ring-1 ring-slate-700 overflow-hidden">
                                                <div className="flex items-center">
                                                    <span className="bg-fuchsia-500 text-black font-black px-3 py-1.5 text-[10px] tracking-widest uppercase">INFO</span>
                                                    <div className="flex-1 relative h-7 overflow-hidden">
                                                        <div className="absolute whitespace-nowrap text-pink-100 font-semibold tracking-widest text-xs animate-[ticker-preview_25s_linear_infinite] flex items-center h-full">
                                                            {data.teks_ticker}
                                                        </div>
                                                    </div>
                                                </div>
                                                <style>{`@keyframes ticker-preview { from { transform: translateX(100%); } to { transform: translateX(-100%); } }`}</style>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Tema Warna */}
                            <SectionCard
                                icon={<Palette size={18} />}
                                title="Tema Warna Latar"
                                subtitle="Warna dasar layar TV publik"
                                accentClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                            >
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                    {THEME_COLORS.map(({ value, label }) => {
                                        const active = data.tema_warna.toLowerCase() === value.toLowerCase();
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setData('tema_warna', value)}
                                                title={label}
                                                className={`group relative aspect-square rounded-xl ring-2 transition-all overflow-hidden ${
                                                    active ? 'ring-fuchsia-500 scale-105' : 'ring-gray-200 dark:ring-gray-700 hover:ring-gray-400'
                                                }`}
                                                style={{ backgroundColor: value }}
                                            >
                                                {/* faux preview content */}
                                                <span className="absolute inset-x-2 top-1.5 h-0.5 rounded-full bg-white/20" />
                                                <span className="absolute inset-x-2 top-3 h-0.5 rounded-full bg-white/10" />
                                                {active && (
                                                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-white text-fuchsia-600 text-[10px] font-black flex items-center justify-center shadow">
                                                        ✓
                                                    </span>
                                                )}
                                                <span className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-[9px] uppercase font-bold tracking-widest text-white/90 bg-black/30">
                                                    {label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={data.tema_warna}
                                            onChange={(e) => setData('tema_warna', e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                                        />
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Custom</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={data.tema_warna}
                                        onChange={(e) => setData('tema_warna', e.target.value)}
                                        className="flex-1 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm font-mono uppercase"
                                        placeholder="#000000"
                                    />
                                </div>
                                <InputError message={errors.tema_warna} className="mt-2" />
                            </SectionCard>

                            {/* Warna Teks */}
                            <SectionCard
                                icon={<Type size={18} />}
                                title="Warna Teks"
                                subtitle="Warna font papan keberangkatan & kedatangan"
                                accentClass="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300"
                            >
                                {([
                                    { field: 'warna_utama' as const, label: 'Teks Utama', hint: 'Jam, no. penerbangan, gate', fallback: '#ffffff' },
                                    { field: 'warna_aksen' as const, label: 'Aksen', hint: 'Judul, header kolom, kota tujuan', fallback: '#fbbf24' },
                                ]).map(({ field, label, hint, fallback }) => (
                                    <div key={field} className="mb-5 last:mb-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</div>
                                                <div className="text-xs text-gray-400">{hint}</div>
                                            </div>
                                            <span
                                                className="text-xs font-mono px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700"
                                                style={{ color: data[field] || fallback }}
                                            >
                                                {(data[field] || fallback).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                            {TEXT_COLORS.map(({ value, label: swatchLabel }) => {
                                                const active = (data[field] || '').toLowerCase() === value.toLowerCase();
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setData(field, value)}
                                                        title={swatchLabel}
                                                        className={`aspect-square rounded-lg ring-2 transition-all ${
                                                            active ? 'ring-cyan-500 scale-105' : 'ring-gray-200 dark:ring-gray-700 hover:ring-gray-400'
                                                        }`}
                                                        style={{ backgroundColor: value }}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                                            <input
                                                type="color"
                                                value={data[field] || fallback}
                                                onChange={(e) => setData(field, e.target.value)}
                                                className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={data[field]}
                                                onChange={(e) => setData(field, e.target.value)}
                                                className="flex-1 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm font-mono uppercase"
                                                placeholder={fallback}
                                            />
                                        </div>
                                        <InputError message={errors[field]} className="mt-2" />
                                    </div>
                                ))}
                            </SectionCard>

                            {/* Background Image */}
                            <SectionCard
                                icon={<ImageIcon size={18} />}
                                title="Gambar Latar Header"
                                subtitle="Banner atas layar publik (opsional)"
                                accentClass="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
                            >
                                {currentBg ? (
                                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-3">
                                        <img src={currentBg} alt="Background" className="w-full h-32 object-cover" />
                                        {bgPreview && (
                                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-fuchsia-600 text-white text-[10px] font-black uppercase tracking-widest">
                                                Pratinjau Baru
                                            </span>
                                        )}
                                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                            {bgPreview && (
                                                <button
                                                    type="button"
                                                    onClick={() => setData('background_header', null)}
                                                    className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                                                    title="Batalkan"
                                                >
                                                    <RefreshCw size={12} />
                                                </button>
                                            )}
                                            {!bgPreview && setting?.background_header && (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const ok = await appConfirm({
                                                            variant: 'warning',
                                                            title: 'Hapus Gambar Latar',
                                                            message: 'Hapus gambar latar header? Perubahan akan diterapkan saat menyimpan.',
                                                            confirmText: 'Ya, Hapus',
                                                            cancelText: 'Batal',
                                                        });
                                                        if (!ok) return;
                                                        setData('remove_background', true);
                                                    }}
                                                    className="px-2 py-1 rounded-full bg-red-600/90 text-white hover:bg-red-700 text-[10px] font-black uppercase tracking-widest"
                                                    title="Hapus latar"
                                                >
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                        {data.remove_background && (
                                            <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center text-white text-xs font-black uppercase tracking-widest">
                                                Akan dihapus saat simpan
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 h-32 flex items-center justify-center text-gray-400 mb-3">
                                        <span className="text-xs">Belum ada gambar latar</span>
                                    </div>
                                )}
                                <input
                                    id="background_header"
                                    type="file"
                                    accept="image/*"
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 dark:file:bg-gray-700 dark:file:text-gray-200"
                                    onChange={(e: any) => setData('background_header', e.target.files?.[0] ?? null)}
                                />
                                <p className="text-[11px] text-gray-400 mt-2">
                                    Resolusi tinggi disarankan, format landscape, maks 5MB.
                                </p>
                                <InputError message={errors.background_header} className="mt-2" />
                            </SectionCard>

                            {/* Save bar */}
                            <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                                <span className="text-xs text-gray-500 mr-auto">
                                    Pengaturan akan langsung diterapkan ke semua layar publik.
                                </span>
                                <PrimaryButton disabled={processing} className="gap-2">
                                    {processing ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Simpan Pengaturan
                                        </>
                                    )}
                                </PrimaryButton>
                            </div>
                        </div>

                        {/* RIGHT — Live preview sticky */}
                        <div className="lg:col-span-1">
                            <div className="lg:sticky lg:top-6 space-y-3">
                                <div className="flex items-center justify-between gap-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <Monitor size={14} className="text-fuchsia-500" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Pratinjau Langsung</p>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold flex items-center gap-1">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                        </span>
                                        Live
                                    </span>
                                </div>
                                <PreviewMockup
                                    layout={data.mode_default}
                                    theme={data.tema_warna}
                                    showDep={data.show_departures}
                                    showArr={data.show_arrivals}
                                    showWeather={data.tampilkan_cuaca}
                                    showAd={data.show_advertisement}
                                    backgroundUrl={currentBg}
                                    namaBandara={data.nama_bandara}
                                    teksTicker={data.teks_ticker}
                                    large
                                />
                                <p className="text-[11px] text-gray-400 px-1">
                                    Pratinjau memperlihatkan susunan dan warna saat tayang di TV publik.
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SectionCard({
    icon, title, subtitle, accentClass, children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    accentClass: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${accentClass}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h3>
                    <p className="text-xs text-gray-500">{subtitle}</p>
                </div>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function PreviewMockup({
    layout, theme, showDep, showArr, showWeather, showAd, backgroundUrl, namaBandara, teksTicker, large = false,
}: {
    layout: 'single' | '2-column' | '3-column';
    theme: string;
    showDep: boolean;
    showArr: boolean;
    showWeather: boolean;
    showAd: boolean;
    backgroundUrl: string | null;
    namaBandara?: string;
    teksTicker?: string;
    large?: boolean;
}) {
    const showTicker = !!(teksTicker && teksTicker.trim().length > 0);
    return (
        <div className={`rounded-2xl overflow-hidden ring-1 ring-white/15 shadow-2xl bg-slate-900 ${large ? '' : 'max-w-md mx-auto'}`}>
            {/* TV bezel */}
            <div className="bg-gradient-to-b from-slate-900 to-black p-2">
                <div
                    className="aspect-video rounded-lg overflow-hidden relative ring-1 ring-white/10"
                    style={{ backgroundColor: theme }}
                >
                    {/* header */}
                    <div className="relative h-1/5 w-full overflow-hidden flex items-center justify-between px-3">
                        {backgroundUrl && (
                            <img src={backgroundUrl} className="absolute inset-0 w-full h-full object-cover opacity-70" alt="" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />
                        <div className="relative z-10 text-white truncate max-w-[55%]">
                            <div className="text-[6px] font-black tracking-widest uppercase opacity-70">FIDS Live</div>
                            <div className="text-[9px] font-black tracking-tight truncate">
                                {namaBandara && namaBandara.trim() ? namaBandara : 'Bandara'}
                            </div>
                        </div>
                        <div className="relative z-10 flex flex-col items-end text-white">
                            <div className="text-[10px] font-black tabular-nums leading-none">12:34</div>
                            <div className="text-[6px] tracking-widest mt-0.5 opacity-70">SAT, 16 MEI</div>
                        </div>
                    </div>

                    {/* body grid */}
                    <div className={`relative grid gap-1 p-1 ${
                        layout === 'single' ? 'grid-cols-1' : layout === '2-column' ? 'grid-cols-2' : 'grid-cols-3'
                    }`} style={{ height: showAd || showTicker ? '60%' : '70%' }}>
                        {showDep && <PreviewPanel title="Berangkat" tone="sky" />}
                        {showArr && <PreviewPanel title="Datang" tone="emerald" />}
                        {layout === '3-column' && showWeather && <PreviewPanel title="Cuaca" tone="amber" weather />}
                        {!showDep && !showArr && !(layout === '3-column' && showWeather) && (
                            <div className="col-span-full flex items-center justify-center text-white/30 text-[10px] uppercase tracking-widest">
                                Tidak ada konten aktif
                            </div>
                        )}
                    </div>

                    {/* ad area */}
                    {showAd && (
                        <div className="relative h-[10%] flex items-center px-2 gap-1 border-t border-white/10">
                            <div className="text-[6px] font-black tracking-[0.18em] text-orange-300 uppercase">Iklan</div>
                            <div className="flex-1 h-3 rounded bg-gradient-to-r from-orange-400/50 via-fuchsia-400/40 to-pink-400/50 animate-pulse" />
                        </div>
                    )}

                    {/* weather strip when not 3-col & no ad */}
                    {!showAd && layout !== '3-column' && showWeather && (
                        <div className="relative h-[10%] flex items-center px-2 gap-1 border-t border-white/10">
                            <div className="text-[6px] font-black tracking-[0.18em] text-amber-300 uppercase">Cuaca</div>
                            <div className="flex-1 h-3 rounded bg-gradient-to-r from-amber-400/40 via-yellow-400/40 to-orange-400/40" />
                        </div>
                    )}

                    {/* ticker */}
                    {showTicker && (
                        <div className="relative h-[10%] flex items-center bg-black/50 border-t border-white/10 overflow-hidden">
                            <div className="bg-pink-500 text-black font-black h-full flex items-center px-2 text-[7px] tracking-widest uppercase shrink-0">INFO</div>
                            <div className="flex-1 h-full relative overflow-hidden">
                                <div className="absolute whitespace-nowrap text-pink-100 font-bold tracking-widest text-[8px] flex items-center h-full" style={{ animation: 'preview-ticker 18s linear infinite' }}>
                                    {teksTicker}
                                </div>
                            </div>
                            <style>{`@keyframes preview-ticker { from { transform: translateX(100%); } to { transform: translateX(-100%); } }`}</style>
                        </div>
                    )}

                    {/* scanlines */}
                    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px)',
                    }} />
                </div>
            </div>
            {/* TV stand */}
            <div className="h-1.5 bg-gradient-to-b from-black to-slate-800" />
            <div className="mx-auto h-1.5 w-16 rounded-b-lg bg-slate-700" />
        </div>
    );
}

function PreviewPanel({ title, tone, weather = false }: { title: string; tone: 'sky' | 'emerald' | 'amber'; weather?: boolean }) {
    const toneMap: Record<string, { bar: string; chip: string }> = {
        sky:     { bar: 'bg-sky-300/40',     chip: 'bg-sky-400/70 text-sky-950' },
        emerald: { bar: 'bg-emerald-300/40', chip: 'bg-emerald-400/70 text-emerald-950' },
        amber:   { bar: 'bg-amber-300/40',   chip: 'bg-amber-400/70 text-amber-950' },
    };
    const t = toneMap[tone];
    return (
        <div className="rounded-md bg-white/5 ring-1 ring-white/10 p-1.5 flex flex-col gap-1">
            <div className={`text-[7px] font-black tracking-widest uppercase rounded px-1 py-0.5 inline-block w-fit ${t.chip}`}>
                {title}
            </div>
            {weather ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-amber-300 text-2xl font-black tabular-nums leading-none drop-shadow">28°</div>
                </div>
            ) : (
                <div className="flex-1 space-y-1 mt-1">
                    {[0,1,2,3].map((i) => (
                        <div key={i} className="flex items-center gap-1">
                            <span className={`h-1 w-1/4 rounded-full ${t.bar}`} />
                            <span className={`h-1 w-1/3 rounded-full ${t.bar} opacity-60`} />
                            <span className={`h-1 w-1/5 rounded-full ${t.bar} opacity-30`} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
