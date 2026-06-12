import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Edit,
    Trash,
    Plus,
    PlaneTakeoff,
    PlaneLanding,
    Search,
    Map,
    ArrowRight,
    CheckCircle2,
    Globe,
} from 'lucide-react';
import MasterHero from '@/Components/MasterHero';
import { appConfirm } from '@/lib/confirm';

interface Airport {
    id: number;
    kode_iata: string;
    nama_bandara: string;
    kota: string;
    negara: string;
}

interface RouteItem {
    id: number;
    airport_asal_id: number;
    airport_tujuan_id: number;
    tipe_layanan: string;
    jenis_rute: string;
    status_aktif: boolean;
    airport_asal?: Airport;
    airport_tujuan?: Airport;
}

interface Props {
    routes: RouteItem[];
    airports: Airport[];
}

export default function Index({ routes, airports }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'departure' | 'arrival'>('departure');

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        airport_asal_id: '',
        airport_tujuan_id: '',
        tipe_layanan: 'domestik',
        jenis_rute: 'departure' as string,
        status_aktif: true,
    });

    const openModal = (routeItem: RouteItem | null = null) => {
        if (routeItem) {
            setEditingId(routeItem.id);
            setData({
                airport_asal_id: routeItem.airport_asal_id.toString(),
                airport_tujuan_id: routeItem.airport_tujuan_id.toString(),
                tipe_layanan: routeItem.tipe_layanan,
                jenis_rute: routeItem.jenis_rute,
                status_aktif: routeItem.status_aktif,
            });
        } else {
            setEditingId(null);
            reset();
            setData('jenis_rute', activeTab);
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(route('admin.routes.update', editingId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.routes.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const deleteRoute = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Rute',
            message: 'Apakah Anda yakin ingin menghapus rute ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route('admin.routes.destroy', id));
    };

    // Filters
    const [query, setQuery] = useState('');
    const [serviceFilter, setServiceFilter] = useState<'all' | 'domestik' | 'internasional'>('all');

    const tabRoutes = useMemo(
        () => routes.filter((r) => r.jenis_rute === activeTab),
        [routes, activeTab],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tabRoutes.filter((r) => {
            if (serviceFilter !== 'all' && r.tipe_layanan !== serviceFilter) return false;
            if (!q) return true;
            return (
                r.airport_asal?.kode_iata?.toLowerCase().includes(q) ||
                r.airport_tujuan?.kode_iata?.toLowerCase().includes(q) ||
                r.airport_asal?.kota?.toLowerCase().includes(q) ||
                r.airport_tujuan?.kota?.toLowerCase().includes(q) ||
                r.airport_asal?.nama_bandara?.toLowerCase().includes(q) ||
                r.airport_tujuan?.nama_bandara?.toLowerCase().includes(q)
            );
        });
    }, [tabRoutes, query, serviceFilter]);

    const stats = useMemo(() => {
        const total = routes.length;
        const domestik = routes.filter((r) => r.tipe_layanan === 'domestik').length;
        const internasional = routes.filter((r) => r.tipe_layanan === 'internasional').length;
        const airportSet = new Set<number>();
        routes.forEach((r) => {
            airportSet.add(r.airport_asal_id);
            airportSet.add(r.airport_tujuan_id);
        });
        return { total, domestik, internasional, airports: airportSet.size };
    }, [routes]);

    const tabLabel = activeTab === 'departure' ? 'Keberangkatan' : 'Kedatangan';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Manajemen Rute
                </h2>
            }
        >
            <Head title="Rute Penerbangan" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <MasterHero
                        gradient="from-pink-600 via-rose-600 to-orange-600"
                        eyebrow="Data Master"
                        icon={<Map size={12} />}
                        title="Rute Penerbangan"
                        description="Pasangan bandara asal dan tujuan beserta jenis layanan (domestik/internasional)."
                        actions={
                            <button
                                onClick={() => openModal()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-pink-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                            >
                                <Plus size={16} /> Tambah Rute
                            </button>
                        }
                        stats={[
                            { label: 'Total', value: stats.total, icon: <Map size={14} /> },
                            { label: 'Domestik', value: stats.domestik, icon: <CheckCircle2 size={14} /> },
                            { label: 'Internasional', value: stats.internasional, icon: <Globe size={14} /> },
                            { label: 'Bandara Terlibat', value: stats.airports, icon: <Map size={14} /> },
                        ]}
                    />

                    {/* Toolbar */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari kode IATA asal/tujuan atau kota..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-pink-500 focus:ring focus:ring-pink-500/20"
                            />
                        </div>

                        {/* Departure / Arrival toggle */}
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700">
                            <button
                                type="button"
                                onClick={() => setActiveTab('departure')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                    activeTab === 'departure'
                                        ? 'bg-white dark:bg-gray-700 text-pink-700 dark:text-pink-200 shadow'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                <PlaneTakeoff size={12} /> Departure
                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200 text-[9px] font-black">
                                    {routes.filter((r) => r.jenis_rute === 'departure').length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('arrival')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                    activeTab === 'arrival'
                                        ? 'bg-white dark:bg-gray-700 text-pink-700 dark:text-pink-200 shadow'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                <PlaneLanding size={12} /> Arrival
                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200 text-[9px] font-black">
                                    {routes.filter((r) => r.jenis_rute === 'arrival').length}
                                </span>
                            </button>
                        </div>

                        {/* Service filter pills */}
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700">
                            {(['all', 'domestik', 'internasional'] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setServiceFilter(f)}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                        serviceFilter === f
                                            ? 'bg-white dark:bg-gray-700 text-pink-700 dark:text-pink-200 shadow'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    {f === 'all' ? 'Semua' : f === 'domestik' ? 'Domestik' : 'Internasional'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cards Grid / Empty State */}
                    {filtered.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center mx-auto mb-4">
                                <Map size={28} className="text-pink-500" />
                            </div>
                            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                {tabRoutes.length === 0
                                    ? `Belum ada rute ${tabLabel.toLowerCase()}`
                                    : 'Tidak ada hasil'}
                            </h5>
                            <p className="text-sm text-gray-500 mt-1">
                                {tabRoutes.length === 0
                                    ? 'Klik "Tambah Rute" untuk menambahkan pasangan bandara baru.'
                                    : 'Coba ubah kata kunci atau filter tipe layanan.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((routeItem) => {
                                const isDomestic = routeItem.tipe_layanan === 'domestik';
                                const stripeClass = isDomestic
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500'
                                    : 'bg-gradient-to-r from-indigo-500 to-violet-500';
                                const chipClass = isDomestic
                                    ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200'
                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200';
                                const ringHover = isDomestic
                                    ? 'hover:ring-pink-300 dark:hover:ring-pink-500'
                                    : 'hover:ring-indigo-300 dark:hover:ring-indigo-500';

                                return (
                                    <div
                                        key={routeItem.id}
                                        className={`group relative rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 ${ringHover} hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden`}
                                    >
                                        <div className={`h-1.5 w-full ${stripeClass}`} />
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${chipClass}`}>
                                                    {isDomestic ? <CheckCircle2 size={9} /> : <Globe size={9} />}
                                                    {isDomestic ? 'Domestik' : 'Internasional'}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                    {routeItem.jenis_rute === 'departure' ? (
                                                        <>
                                                            <PlaneTakeoff size={10} /> DEP
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PlaneLanding size={10} /> ARR
                                                        </>
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-center min-w-0 flex-1">
                                                    <div className="text-2xl font-black tracking-widest text-gray-900 dark:text-white leading-none">
                                                        {routeItem.airport_asal?.kode_iata ?? '???'}
                                                    </div>
                                                    <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 truncate">
                                                        {routeItem.airport_asal?.kota ?? '-'}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow">
                                                    <ArrowRight size={16} />
                                                </div>
                                                <div className="text-center min-w-0 flex-1">
                                                    <div className="text-2xl font-black tracking-widest text-gray-900 dark:text-white leading-none">
                                                        {routeItem.airport_tujuan?.kode_iata ?? '???'}
                                                    </div>
                                                    <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 truncate">
                                                        {routeItem.airport_tujuan?.kota ?? '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-2">
                                                {routeItem.status_aktif ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[9px] font-black uppercase tracking-widest">
                                                        <CheckCircle2 size={9} /> Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[9px] font-black uppercase tracking-widest">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
                                                <button
                                                    onClick={() => openModal(routeItem)}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-pink-50 text-pink-700 hover:bg-pink-600 hover:text-white transition border border-pink-100 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-700/40"
                                                >
                                                    <Edit size={12} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteRoute(routeItem.id)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                                    title="Hapus"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 text-white">
                            <h3 className="text-lg font-bold">
                                {editingId ? 'Edit Rute' : 'Tambah Rute Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-white/80 hover:text-white">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Jenis Rute</label>
                                <select
                                    value={data.jenis_rute}
                                    onChange={(e) => setData('jenis_rute', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-pink-500 focus:border-pink-500"
                                    required
                                >
                                    <option value="departure">Keberangkatan</option>
                                    <option value="arrival">Kedatangan</option>
                                </select>
                                {errors.jenis_rute && <p className="text-red-500 text-xs mt-1">{errors.jenis_rute}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Bandara Asal</label>
                                <select
                                    value={data.airport_asal_id}
                                    onChange={(e) => setData('airport_asal_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-pink-500 focus:border-pink-500"
                                    required
                                >
                                    <option value="" disabled>Pilih Bandara Asal</option>
                                    {airports.map((airport) => (
                                        <option key={airport.id} value={airport.id}>
                                            {airport.kode_iata} - {airport.nama_bandara} ({airport.kota})
                                        </option>
                                    ))}
                                </select>
                                {errors.airport_asal_id && <p className="text-red-500 text-xs mt-1">{errors.airport_asal_id}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Bandara Tujuan</label>
                                <select
                                    value={data.airport_tujuan_id}
                                    onChange={(e) => setData('airport_tujuan_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-pink-500 focus:border-pink-500"
                                    required
                                >
                                    <option value="" disabled>Pilih Bandara Tujuan</option>
                                    {airports.map((airport) => (
                                        <option key={airport.id} value={airport.id}>
                                            {airport.kode_iata} - {airport.nama_bandara} ({airport.kota})
                                        </option>
                                    ))}
                                </select>
                                {errors.airport_tujuan_id && <p className="text-red-500 text-xs mt-1">{errors.airport_tujuan_id}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Tipe Layanan</label>
                                <select
                                    value={data.tipe_layanan}
                                    onChange={(e) => setData('tipe_layanan', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-pink-500 focus:border-pink-500"
                                    required
                                >
                                    <option value="domestik">Domestik</option>
                                    <option value="internasional">Internasional</option>
                                </select>
                                {errors.tipe_layanan && <p className="text-red-500 text-xs mt-1">{errors.tipe_layanan}</p>}
                            </div>

                            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.status_aktif}
                                        onChange={(e) => setData('status_aktif', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Status Aktif</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700 mt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Rute'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
