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
    PlaneTakeoff,
    X,
    Eye,
    Search,
    DoorOpen,
    MapPin,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import MasterHero from '@/Components/MasterHero';
import { appConfirm } from '@/lib/confirm';

interface Flight {
    id: number;
    nomor_penerbangan: string;
    tujuan: string;
    jam_jadwal: string;
    status: string;
    airline: {
        nama: string;
        logo: string | null;
    };
}

interface Gate {
    id: number;
    kode_gate: string;
    nama_gate: string;
    terminal: string;
    status_gate: 'aktif' | 'tidak_aktif' | 'maintenance';
    petunjuk_arah: string | null;
    flights?: Flight[];
}

interface Props {
    gates: Gate[];
    flights: Flight[];
}

export default function Index({ gates, flights }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedGate, setSelectedGate] = useState<Gate | null>(null);

    const { data, setData, post, put, delete: destroy, processing, reset } = useForm({
        kode_gate: '',
        nama_gate: '',
        terminal: 'Domestik',
        status_gate: 'tidak_aktif',
        petunjuk_arah: '',
        flight_id: '',
    });

    const openModal = (gate: Gate | null = null) => {
        if (gate) {
            setData({
                kode_gate: gate.kode_gate,
                nama_gate: gate.nama_gate,
                terminal: gate.terminal,
                status_gate: gate.status_gate,
                petunjuk_arah: gate.petunjuk_arah ?? '',
                flight_id: '',
            });
            setSelectedGate(gate);
        } else {
            reset();
            setSelectedGate(null);
        }
        setIsModalOpen(true);
    };

    const openAssignModal = (gate: Gate) => {
        setData({
            kode_gate: gate.kode_gate,
            nama_gate: gate.nama_gate,
            terminal: gate.terminal,
            status_gate: gate.status_gate,
            petunjuk_arah: gate.petunjuk_arah ?? '',
            flight_id: '',
        });
        setSelectedGate(gate);
        setIsAssignModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsAssignModalOpen(false);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedGate) {
            put(route('admin.gates.update', selectedGate.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.gates.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Gate',
            message: 'Yakin ingin menghapus Boarding Gate ini?',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route('admin.gates.destroy', id));
    };

    const removeFlight = async (gateId: number, flightId: number) => {
        const ok = await appConfirm({
            variant: 'warning',
            title: 'Lepas Penerbangan',
            message: 'Penerbangan akan dilepaskan dari gate ini.',
            confirmText: 'Ya, Lepas',
            cancelText: 'Batal',
        });
        if (!ok) return;
        post(route('admin.gates.remove-flight', { gate: gateId, flight: flightId }));
    };

    const toggleStatus = (gate: Gate) => {
        const newStatus = gate.status_gate === 'aktif' ? 'tidak_aktif' : 'aktif';
        router.put(route('admin.gates.update', gate.id), {
            kode_gate: gate.kode_gate,
            nama_gate: gate.nama_gate,
            terminal: gate.terminal,
            status_gate: newStatus,
            petunjuk_arah: gate.petunjuk_arah ?? '',
        });
    };

    // ----- UI state for filtering / search -----
    const [query, setQuery] = useState('');
    const [terminalFilter, setTerminalFilter] = useState<string>('all');

    const terminals = useMemo(() => {
        return Array.from(new Set(gates.map((g) => g.terminal).filter(Boolean)));
    }, [gates]);

    const filtered = useMemo(() => {
        return gates.filter((g) => {
            if (terminalFilter !== 'all' && g.terminal !== terminalFilter) return false;
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                g.kode_gate?.toLowerCase().includes(q) ||
                g.nama_gate?.toLowerCase().includes(q) ||
                g.terminal?.toLowerCase().includes(q)
            );
        });
    }, [gates, query, terminalFilter]);

    const stats = useMemo(() => ({
        total: gates.length,
        active: gates.filter((g) => g.status_gate === 'aktif').length,
        terminals: new Set(gates.map((g) => g.terminal)).size,
        closed: gates.filter((g) => g.status_gate !== 'aktif').length,
    }), [gates]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Alokasi Boarding Gate
                </h2>
            }
        >
            <Head title="Boarding Gates" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <MasterHero
                        gradient="from-violet-600 via-purple-600 to-fuchsia-700"
                        eyebrow="Data Master"
                        icon={<DoorOpen size={12} />}
                        title="Boarding Gate"
                        description="Gate keberangkatan beserta terminal dan status operasional."
                        actions={
                            <button
                                onClick={() => openModal()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-violet-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                            >
                                <Plus size={16} /> Tambah Gate
                            </button>
                        }
                        stats={[
                            { label: 'Total', value: stats.total, icon: <DoorOpen size={14} /> },
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
                                placeholder="Cari kode gate atau terminal..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-violet-500 focus:ring focus:ring-violet-500/20"
                            />
                        </div>
                        {terminals.length > 0 && (
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => setTerminalFilter('all')}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                        terminalFilter === 'all'
                                            ? 'bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-200 shadow'
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
                                                ? 'bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-200 shadow'
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
                            <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                                <DoorOpen size={28} className="text-violet-500" />
                            </div>
                            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                {gates.length === 0 ? 'Belum ada gate' : 'Tidak ada hasil'}
                            </h5>
                            <p className="text-sm text-gray-500 mt-1">
                                {gates.length === 0
                                    ? 'Klik "Tambah Gate" untuk menambahkan boarding gate.'
                                    : 'Coba ubah kata kunci atau filter terminal.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((gate) => {
                                const isActive = gate.status_gate === 'aktif';
                                return (
                                    <div
                                        key={gate.id}
                                        className="group relative rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-violet-300 dark:hover:ring-violet-500 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
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
                                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shrink-0">
                                                    <span className="font-black text-xl tracking-wider drop-shadow">
                                                        {gate.kode_gate}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded-full bg-violet-600">
                                                            Gate {gate.kode_gate}
                                                        </span>
                                                        {isActive ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                                                                <CheckCircle2 size={10} /> Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                                <XCircle size={10} /> {gate.status_gate === 'maintenance' ? 'Maint.' : 'Off'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h5 className="mt-1 text-sm font-bold text-gray-900 dark:text-white leading-snug truncate">
                                                        {gate.nama_gate}
                                                    </h5>
                                                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                                        <MapPin size={11} className="shrink-0" />
                                                        <span className="truncate">Terminal {gate.terminal}</span>
                                                        {gate.petunjuk_arah && (
                                                            <span className="ml-1 text-amber-500 font-bold text-base leading-none">
                                                                {gate.petunjuk_arah}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleStatus(gate)}
                                                    className={`p-1.5 rounded-md transition-colors shrink-0 ${
                                                        isActive
                                                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-800 dark:text-emerald-300'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}
                                                    title={isActive ? 'Tutup Gate' : 'Buka Gate'}
                                                >
                                                    {isActive ? <Power size={14} /> : <PowerOff size={14} />}
                                                </button>
                                            </div>

                                            {/* Active Flights List */}
                                            <div className="mt-3 space-y-2">
                                                {gate.flights && gate.flights.length > 0 ? (
                                                    gate.flights.map((flight) => (
                                                        <div
                                                            key={flight.id}
                                                            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700 relative group/flight"
                                                        >
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <span className="font-bold text-violet-600 dark:text-violet-400 text-sm">
                                                                    {flight.nomor_penerbangan}
                                                                </span>
                                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                                                                    {flight.jam_jadwal.substring(0, 5)}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                                                To: {flight.tujuan}
                                                            </div>
                                                            <button
                                                                onClick={() => removeFlight(gate.id, flight.id)}
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
                                                onClick={() => openAssignModal(gate)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white transition border border-violet-100 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-700/40"
                                            >
                                                <PlaneTakeoff size={12} /> Assign
                                            </button>
                                            <button
                                                onClick={() => openModal(gate)}
                                                className="p-2 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <a
                                                href={`/public/gate/boarding/details?id=gate-${parseInt(String(gate.kode_gate), 10) || gate.kode_gate}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Buka Layar Display"
                                                className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                                            >
                                                <Eye size={14} />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(gate.id)}
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

            {/* Modal Form Tambah/Edit Gate */}
            {isModalOpen && !isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {selectedGate ? 'Edit Gate' : 'Tambah Gate Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Kode Gate (No)</label>
                                <input
                                    type="text"
                                    value={data.kode_gate}
                                    onChange={(e) => setData('kode_gate', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Gate</label>
                                <input
                                    type="text"
                                    value={data.nama_gate}
                                    onChange={(e) => setData('nama_gate', e.target.value)}
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
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Petunjuk Arah <span className="text-gray-400 font-normal">(opsional)</span>
                                </label>
                                <div className="grid grid-cols-3 gap-1.5 w-36">
                                    {[
                                        { sym: '↖', label: 'Kiri Atas' },
                                        { sym: '⬆', label: 'Lurus' },
                                        { sym: '↗', label: 'Kanan Atas' },
                                        { sym: '⬅', label: 'Kiri' },
                                        { sym: '',  label: 'Hapus' },
                                        { sym: '➡', label: 'Kanan' },
                                        { sym: '↙', label: 'Kiri Bawah' },
                                        { sym: '⬇', label: 'Turun' },
                                        { sym: '↘', label: 'Kanan Bawah' },
                                    ].map(({ sym, label }) => (
                                        <button
                                            key={label}
                                            type="button"
                                            title={label}
                                            onClick={() => setData('petunjuk_arah', sym)}
                                            className={`h-10 rounded-md text-xl font-bold transition-all border ${
                                                data.petunjuk_arah === sym && sym !== ''
                                                    ? 'bg-amber-400 border-amber-500 text-black scale-105 shadow'
                                                    : sym === ''
                                                        ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 text-xs font-normal hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30'
                                                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-900/20'
                                            }`}
                                        >
                                            {sym === '' ? '✕' : sym}
                                        </button>
                                    ))}
                                </div>
                                {data.petunjuk_arah && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Dipilih: <span className="text-lg font-bold text-amber-500">{data.petunjuk_arah}</span>
                                    </p>
                                )}
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
                                    className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50"
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
            {isAssignModalOpen && selectedGate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Assign Penerbangan (Gate {selectedGate.kode_gate})
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Pilih penerbangan keberangkatan hari ini yang akan diarahkan ke gate ini.</p>

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
                                            {f.jam_jadwal.substring(0, 5)} - {f.nomor_penerbangan} ({f.tujuan})
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
                                    className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
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
