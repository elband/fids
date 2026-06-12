import { useMemo, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus,
    Pencil,
    Trash2,
    Power,
    PowerOff,
    Loader2,
    PlaneLanding,
    X,
    Eye,
    Search,
    Briefcase,
    MapPin,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import MasterHero from '@/Components/MasterHero';
import { appConfirm } from '@/lib/confirm';

interface Flight {
    id: number;
    nomor_penerbangan: string;
    airport_asal?: {
        id: number;
        nama_bandara: string;
        kota: string;
        kode_iata: string;
    } | null;
    jam_jadwal: string;
    status: string;
    airline: {
        nama: string;
        logo: string | null;
    };
}

interface BaggageClaim {
    id: number;
    nomor_belt: string;
    area: string | null;
    terminal: string;
    status_belt: 'aktif' | 'tidak_aktif' | 'maintenance';
    flights?: Flight[];
}

interface Props {
    claims: BaggageClaim[];
    flights: Flight[];
}

export default function Index({ claims, flights }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<BaggageClaim | null>(null);

    const { data, setData, post, put, delete: destroy, processing, reset } = useForm({
        nomor_belt: '',
        area: '',
        terminal: 'Domestik',
        status_belt: 'tidak_aktif',
        flight_id: '',
    });

    const openModal = (claim: BaggageClaim | null = null) => {
        if (claim) {
            setData({
                nomor_belt: claim.nomor_belt,
                area: claim.area || '',
                terminal: claim.terminal,
                status_belt: claim.status_belt,
                flight_id: '',
            });
            setSelectedClaim(claim);
        } else {
            reset();
            setSelectedClaim(null);
        }
        setIsModalOpen(true);
    };

    const openAssignModal = (claim: BaggageClaim) => {
        setData({
            nomor_belt: claim.nomor_belt,
            area: claim.area || '',
            terminal: claim.terminal,
            status_belt: claim.status_belt,
            flight_id: '',
        });
        setSelectedClaim(claim);
        setIsAssignModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsAssignModalOpen(false);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedClaim) {
            put(route('admin.baggage-claims.update', selectedClaim.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.baggage-claims.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Belt Bagasi',
            message: 'Yakin ingin menghapus Conveyor Belt ini?',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route('admin.baggage-claims.destroy', id));
    };

    const removeFlight = async (claimId: number, flightId: number) => {
        const ok = await appConfirm({
            variant: 'warning',
            title: 'Lepas Penerbangan',
            message: 'Penerbangan akan dilepaskan dari belt ini.',
            confirmText: 'Ya, Lepas',
            cancelText: 'Batal',
        });
        if (!ok) return;
        post(route('admin.baggage-claims.remove-flight', { baggage_claim: claimId, flight: flightId }));
    };

    const toggleStatus = (claim: BaggageClaim) => {
        const newStatus = claim.status_belt === 'aktif' ? 'tidak_aktif' : 'aktif';
        router.put(route('admin.baggage-claims.update', claim.id), {
            nomor_belt: claim.nomor_belt,
            area: claim.area || '',
            terminal: claim.terminal,
            status_belt: newStatus,
        });
    };

    // ----- UI state for filtering / search -----
    const [query, setQuery] = useState('');
    const [terminalFilter, setTerminalFilter] = useState<string>('all');

    const terminals = useMemo(() => {
        return Array.from(new Set(claims.map((c) => c.terminal).filter(Boolean)));
    }, [claims]);

    const filtered = useMemo(() => {
        return claims.filter((c) => {
            if (terminalFilter !== 'all' && c.terminal !== terminalFilter) return false;
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                c.nomor_belt?.toLowerCase().includes(q) ||
                c.terminal?.toLowerCase().includes(q) ||
                c.area?.toLowerCase().includes(q)
            );
        });
    }, [claims, query, terminalFilter]);

    const stats = useMemo(() => ({
        total: claims.length,
        active: claims.filter((c) => c.status_belt === 'aktif').length,
        terminals: new Set(claims.map((c) => c.terminal)).size,
        closed: claims.filter((c) => c.status_belt !== 'aktif').length,
    }), [claims]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Alokasi Baggage Claim
                </h2>
            }
        >
            <Head title="Baggage Claims" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <MasterHero
                        gradient="from-fuchsia-600 via-pink-600 to-rose-600"
                        eyebrow="Data Master"
                        icon={<Briefcase size={12} />}
                        title="Belt Bagasi"
                        description="Belt pengambilan bagasi beserta terminal dan area."
                        actions={
                            <button
                                onClick={() => openModal()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-fuchsia-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                            >
                                <Plus size={16} /> Tambah Belt
                            </button>
                        }
                        stats={[
                            { label: 'Total', value: stats.total, icon: <Briefcase size={14} /> },
                            { label: 'Aktif', value: stats.active, icon: <CheckCircle2 size={14} /> },
                            { label: 'Terminal', value: stats.terminals, icon: <MapPin size={14} /> },
                            { label: 'Tertutup', value: stats.closed, icon: <XCircle size={14} /> },
                        ]}
                    />

                    {/* Toolbar */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nomor belt, terminal, atau area..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-fuchsia-500 focus:ring focus:ring-fuchsia-500/20"
                            />
                        </div>
                        {terminals.length > 0 && (
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => setTerminalFilter('all')}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                        terminalFilter === 'all'
                                            ? 'bg-white dark:bg-gray-700 text-fuchsia-700 dark:text-fuchsia-200 shadow'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    Semua
                                </button>
                                {terminals.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTerminalFilter(t)}
                                        className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                            terminalFilter === t
                                                ? 'bg-white dark:bg-gray-700 text-fuchsia-700 dark:text-fuchsia-200 shadow'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cards Grid */}
                    {filtered.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-900/30 flex items-center justify-center mx-auto mb-4">
                                <Briefcase size={28} className="text-fuchsia-500" />
                            </div>
                            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                {claims.length === 0 ? 'Belum ada belt bagasi' : 'Tidak ada hasil'}
                            </h5>
                            <p className="text-sm text-gray-500 mt-1">
                                {claims.length === 0
                                    ? 'Klik "Tambah Belt" untuk menambahkan baggage claim.'
                                    : 'Coba ubah kata kunci atau filter terminal.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((claim) => {
                                const isActive = claim.status_belt === 'aktif';
                                return (
                                    <div
                                        key={claim.id}
                                        className="group relative rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-fuchsia-300 dark:hover:ring-fuchsia-500 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
                                    >
                                        <div
                                            className={`h-1.5 w-full ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                                    : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600'
                                            }`}
                                        />
                                        <div className="p-4 flex-1">
                                            <div className="flex items-start gap-3">
                                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg shrink-0">
                                                    <span className="font-black text-xl tracking-wider drop-shadow">
                                                        {claim.nomor_belt}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded-full bg-fuchsia-600">
                                                            Belt {claim.nomor_belt}
                                                        </span>
                                                        {isActive ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                                                                <CheckCircle2 size={10} /> Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                                <XCircle size={10} /> {claim.status_belt === 'maintenance' ? 'Maint.' : 'Off'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h5 className="mt-1 text-sm font-bold text-gray-900 dark:text-white leading-snug truncate">
                                                        Conveyor {claim.nomor_belt}
                                                    </h5>
                                                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                                        <MapPin size={11} className="shrink-0" />
                                                        <span className="truncate">
                                                            Terminal {claim.terminal}
                                                            {claim.area ? ` · ${claim.area}` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleStatus(claim)}
                                                    className={`p-1.5 rounded-md transition-colors shrink-0 ${
                                                        isActive
                                                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-800 dark:text-emerald-300'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}
                                                    title={isActive ? 'Tutup Belt' : 'Buka Belt'}
                                                >
                                                    {isActive ? <Power size={14} /> : <PowerOff size={14} />}
                                                </button>
                                            </div>

                                            {/* Active Flights List */}
                                            <div className="mt-3 space-y-2">
                                                {claim.flights && claim.flights.length > 0 ? (
                                                    claim.flights.map((flight) => (
                                                        <div
                                                            key={flight.id}
                                                            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700 relative group/flight"
                                                        >
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400 text-sm">
                                                                    {flight.nomor_penerbangan}
                                                                </span>
                                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300">
                                                                    {flight.jam_jadwal.substring(0, 5)}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                                                From: {flight.airport_asal?.kota ?? flight.airport_asal?.kode_iata ?? flight.airport_asal?.nama_bandara ?? '-'}
                                                            </div>
                                                            <button
                                                                onClick={() => removeFlight(claim.id, flight.id)}
                                                                className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-600 rounded-full p-0.5 opacity-0 group-hover/flight:opacity-100 transition-opacity hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                                                                title="Lepas Penerbangan"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-3 text-[11px] text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                                        Belum ada penerbangan
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer actions */}
                                        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                            <button
                                                onClick={() => openAssignModal(claim)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-600 hover:text-white transition border border-fuchsia-100 dark:bg-fuchsia-900/30 dark:text-fuchsia-200 dark:border-fuchsia-700/40"
                                            >
                                                <PlaneLanding size={12} /> Assign
                                            </button>
                                            <button
                                                onClick={() => openModal(claim)}
                                                className="p-2 rounded-lg text-gray-500 hover:text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/30 transition"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <a
                                                href={`/public/gate/baggageclaim/details?id=gate-${parseInt(String(claim.nomor_belt), 10) || claim.nomor_belt}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Buka Layar Display"
                                                className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                                            >
                                                <Eye size={14} />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(claim.id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                                title="Hapus"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form Tambah/Edit Claim */}
            {isModalOpen && !isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {selectedClaim ? 'Edit Baggage Claim' : 'Tambah Belt Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Belt</label>
                                <input
                                    type="text"
                                    value={data.nomor_belt}
                                    onChange={(e) => setData('nomor_belt', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Terminal</label>
                                <select
                                    value={data.terminal}
                                    onChange={(e) => setData('terminal', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="Domestik">Domestik</option>
                                    <option value="Internasional">Internasional</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Area/Zona (Opsional)</label>
                                <input
                                    type="text"
                                    value={data.area}
                                    onChange={(e) => setData('area', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="e.g. Zone A"
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 rounded-md bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    {processing && <Loader2 size={16} className="animate-spin" />}
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Assign Flight */}
            {isAssignModalOpen && selectedClaim && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Assign Penerbangan (Belt {selectedClaim.nomor_belt})
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Pilih penerbangan kedatangan hari ini yang akan diarahkan ke belt ini.</p>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Penerbangan</label>
                                <select
                                    value={data.flight_id}
                                    onChange={(e) => setData('flight_id', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="">-- Pilih Penerbangan --</option>
                                    {flights.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.jam_jadwal.substring(0, 5)} - {f.nomor_penerbangan} ({f.airport_asal?.kode_iata ?? f.airport_asal?.kota ?? '-'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 rounded-md bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-700 disabled:opacity-50"
                                >
                                    {processing && <Loader2 size={16} className="animate-spin" />}
                                    Assign Flight
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
