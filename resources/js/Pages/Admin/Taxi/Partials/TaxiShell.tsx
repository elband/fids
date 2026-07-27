import { Head, Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Car, ExternalLink, Film, LayoutDashboard, MonitorSmartphone,
    Signpost, SlidersHorizontal, Type, Wallet,
} from 'lucide-react';

interface Props {
    title: string;
    subtitle: string;
    /** Tombol aksi utama di kanan hero (mis. "Tambah Tarif"). */
    action?: ReactNode;
    stats?: ReactNode;
}

/**
 * Kerangka bersama seluruh halaman modul Taxi Information: judul, tab submenu,
 * dan pintasan membuka layar publik. Tab hanya menampilkan menu yang boleh
 * diakses pengguna (permission dibagikan lewat props Inertia).
 */
export default function TaxiShell({ title, subtitle, action, stats, children }: PropsWithChildren<Props>) {
    const { props } = usePage();
    const roles = (props.auth.roles ?? []) as string[];
    const permissions = (props.auth.permissions ?? []) as string[];
    const can = (p: string) => roles.includes('Super Admin') || permissions.includes(p);

    const tabs = [
        { name: 'Dashboard', icon: <LayoutDashboard size={15} />, href: route('admin.taxi.dashboard'), active: route().current('admin.taxi.dashboard'), show: can('taxi.view') },
        { name: 'Petunjuk Arah', icon: <Signpost size={15} />, href: route('admin.taxi.directions.index'), active: route().current('admin.taxi.directions.*'), show: can('taxi.directions.manage') },
        { name: 'Counter', icon: <Car size={15} />, href: route('admin.taxi.counters.index'), active: route().current('admin.taxi.counters.*'), show: can('taxi.counters.manage') },
        { name: 'Tarif', icon: <Wallet size={15} />, href: route('admin.taxi.fares.index'), active: route().current('admin.taxi.fares.*'), show: can('taxi.fares.manage') },
        { name: 'Video', icon: <Film size={15} />, href: route('admin.taxi.videos.index'), active: route().current('admin.taxi.videos.*'), show: can('taxi.videos.manage') },
        { name: 'Running Text', icon: <Type size={15} />, href: route('admin.taxi.running-texts.index'), active: route().current('admin.taxi.running-texts.*'), show: can('taxi.runningtext.manage') },
        { name: 'Pengaturan', icon: <SlidersHorizontal size={15} />, href: route('admin.taxi.settings.index'), active: route().current('admin.taxi.settings.*'), show: can('taxi.settings.manage') },
        { name: 'Monitoring', icon: <MonitorSmartphone size={15} />, href: route('admin.taxi.screens.index'), active: route().current('admin.taxi.screens.*'), show: can('taxi.screens.view') },
    ].filter((t) => t.show);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Taxi Information &amp; Digital Signage
                </h2>
            }
        >
            <Head title={`${title} — Taxi Information`} />

            <div className="space-y-6">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl shadow-xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-700 text-white">
                    <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-amber-400/25 blur-3xl" />
                    <div aria-hidden className="absolute inset-0 opacity-[0.06]" style={{
                        backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                    }} />

                    <div className="relative p-7 lg:p-9 space-y-5">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 ring-1 ring-white/20 text-[11px] font-bold uppercase tracking-[0.2em]">
                                    <Car size={12} /> Taxi Information
                                </div>
                                <h3 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow">{title}</h3>
                                <p className="text-white/80 max-w-3xl leading-relaxed">{subtitle}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                {action}
                                <a
                                    href={route('public.taxi')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 ring-1 ring-white/25 font-semibold hover:bg-white/20 transition"
                                >
                                    <ExternalLink size={16} /> Buka Layar
                                </a>
                            </div>
                        </div>

                        {stats}
                    </div>
                </div>

                {/* Tabs submenu */}
                <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                                tab.active
                                    ? 'bg-amber-500 text-slate-900 shadow'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {tab.icon}
                            {tab.name}
                        </Link>
                    ))}
                </div>

                {children}
            </div>
        </AuthenticatedLayout>
    );
}

/** Kartu statistik kecil untuk area hero. */
export function TaxiStat({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
    return (
        <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 px-4 py-3">
            <div className="flex items-center gap-2 text-white/75 text-[10px] uppercase tracking-[0.18em] font-bold">
                {icon}
                {label}
            </div>
            <div className="mt-1 text-2xl font-black tabular-nums">{value}</div>
        </div>
    );
}
