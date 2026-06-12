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
    Keyboard,
    MapPin,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import MasterHero from '@/Components/MasterHero';
import { appConfirm } from '@/lib/confirm';

interface Flight {
    id: number;
    nomor_penerbangan: string;
    airport_tujuan: {
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

interface Airline {
    id: number;
    nama: string;
}

interface CheckinCounter {
    id: number;
    nomor_counter: string;
    area: string | null;
    terminal: string;
    status_counter: 'buka' | 'tutup' | 'standby';
    airline_id: number | null;
    airline?: Airline;
    flights?: Flight[];
}

interface Props {
    counters: CheckinCounter[];
    airlines: Airline[];
    flights: Flight[];
}

export default function Index({ counters, airlines, flights }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedCounter, setSelectedCounter] = useState<CheckinCounter | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        nomor_counter: '',
        area: '',
        terminal: 'Domestik',
        status_counter: 'tutup',
        airline_id: '',
        flight_id: '',
    });

    const openModal = (counter: CheckinCounter | null = null) => {
        if (counter) {
            setData({
                nomor_counter: counter.nomor_counter,
                area: counter.area || '',
                terminal: counter.terminal,
                status_counter: counter.status_counter,
                airline_id: counter.airline_id?.toString() || '',
                flight_id: '',
            });
            setSelectedCounter(counter);
        } else {
            // Auto increment counter number
            const maxNum = counters.reduce((max, c) => {
                const num = parseInt(c.nomor_counter);
                return isNaN(num) ? max : Math.max(max, num);
            }, 0);

            const nextNum = (maxNum + 1).toString().padStart(2, '0');

            setData({
                nomor_counter: nextNum,
                area: '',
                terminal: 'Domestik',
                status_counter: 'tutup',
                airline_id: '',
                flight_id: '',
            });
            setSelectedCounter(null);
        }
        setIsModalOpen(true);
    };

    const openAssignModal = (counter: CheckinCounter) => {
        setData({
            nomor_counter: counter.nomor_counter,
            area: counter.area || '',
            terminal: counter.terminal,
            status_counter: counter.status_counter,
            airline_id: counter.airline_id?.toString() || '',
            flight_id: '',
        });
        setSelectedCounter(counter);
        setIsAssignModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsAssignModalOpen(false);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCounter && isAssignModalOpen) {
            // Assign flight implicitly uses update
            put(route('admin.checkin-counters.update', selectedCounter.id), {
                onSuccess: () => closeModal(),
            });
        } else if (selectedCounter) {
            put(route('admin.checkin-counters.update', selectedCounter.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.checkin-counters.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Counter',
            message: 'Yakin ingin menghapus Check-in Counter ini?',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route('admin.checkin-counters.destroy', id));
    };

    const removeFlight = async (counterId: number, flightId: number) => {
        const ok = await appConfirm({
            variant: 'warning',
            title: 'Lepas Penerbangan',
            message: 'Penerbangan akan dilepaskan dari counter ini.',
            confirmText: 'Ya, Lepas',
            cancelText: 'Batal',
        });
        if (!ok) return;
        post(route('admin.checkin-counters.remove-flight', { checkin_counter: counterId, flight: flightId }));
    };

    const toggleStatus = (counter: CheckinCounter) => {
        const newStatus = counter.status_counter === 'buka' ? 'tutup' : 'buka';
        router.put(route('admin.checkin-counters.update', counter.id), {
            nomor_counter: counter.nomor_counter,
            area: counter.area || '',
            terminal: counter.terminal,
            status_counter: newStatus,
            airline_id: counter.airline_id?.toString() || '',
        });
    };

    // ----- UI state for filtering / search -----
    const [query, setQuery] = useState('');
    const [terminalFilter, setTerminalFilter] = useState<string>('all');

    const terminals = useMemo(() => {
        return Array.from(new Set(counters.map((c) => c.terminal).filter(Boolean)));
    }, [counters]);

    const filtered = useMemo(() => {
        return counters.filter((c) => {
            if (terminalFilter !== 'all' && c.terminal !== terminalFilter) return false;
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                c.nomor_counter?.toLowerCase().includes(q) ||
                c.terminal?.toLowerCase().includes(q) ||
                c.area?.toLowerCase().includes(q) ||
                c.airline?.nama?.toLowerCase().includes(q)
            );
        });
    }, [counters, query, terminalFilter]);

    const stats = useMemo(() => ({
        total: counters.length,
        active: counters.filter((c) => c.status_counter === 'buka').length,
        terminals: new Set(counters.map((c) => c.terminal)).size,
        closed: counters.filter((c) => c.status_counter !== 'buka').length,
    }), [counters]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Alokasi Check-in Counter
                </h2>
            }
        >
            <Head title="Check-in Counters" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <MasterHero
                        gradient="from-sky-600 via-cyan-600 to-teal-600"
                        eyebrow="Data Master"
                        icon={<Keyboard size={12} />}
                        title="Check-in Counter"
                        description="Counter check-in beserta terminal dan status."
                        actions={
                            <button
                                onClick={() => openModal()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sky-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                            >
                                <Plus size={16} /> Tambah Counter
                            </button>
                        }
                        stats={[
                            { label: 'Total', value: stats.total, icon: <Keyboard size={14} /> },
                            { label: 'Buka', value: stats.active, icon: <CheckCircle2 size={14} /> },
                            { label: 'Terminal', value: stats.terminals, icon: <MapPin size={14} /> },
                            { label: 'Tutup', value: stats.closed, icon: <XCircle size={14} /> },
                        ]}
                    />

                    {/* Toolbar */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nomor counter, terminal, atau area..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-sky-500 focus:ring focus:ring-sky-500/20"
                            />
                        </div>
                        {terminals.length > 0 && (
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => setTerminalFilter('all')}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                        terminalFilter === 'all'
                                            ? 'bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-200 shadow'
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
                                                ? 'bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-200 shadow'
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
                            <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-4">
                                <Keyboard size={28} className="text-sky-500" />
                            </div>
                            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                {counters.length === 0 ? 'Belum ada counter' : 'Tidak ada hasil'}
                            </h5>
                            <p className="text-sm text-gray-500 mt-1">
                                {counters.length === 0
                                    ? 'Klik "Tambah Counter" untuk menambahkan check-in counter.'
                                    : 'Coba ubah kata kunci atau filter terminal.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((counter) => {
                                const isActive = counter.status_counter === 'buka';
                                return (
                                    <div
                                        key={counter.id}
                                        className="group relative rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-sky-300 dark:hover:ring-sky-500 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
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
                                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-600 text-white flex items-center justify-center shadow-lg shrink-0">
                                                    <span className="font-black text-xl tracking-wider drop-shadow">
                                                        {counter.nomor_counter}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded-full bg-sky-600">
                                                            Counter {counter.nomor_counter}
                                                        </span>
                                                        {isActive ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                                                                <CheckCircle2 size={10} /> Buka
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                                <XCircle size={10} /> {counter.status_counter === 'standby' ? 'Standby' : 'Tutup'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h5 className="mt-1 text-sm font-bold text-gray-900 dark:text-white leading-snug truncate">
                                                        {counter.airline?.nama || 'Common Use'}
                                                    </h5>
                                                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                                        <MapPin size={11} className="shrink-0" />
                                                        <span className="truncate">
                                                            Terminal {counter.terminal}
                                                            {counter.area ? ` · ${counter.area}` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleStatus(counter)}
                                                    className={`p-1.5 rounded-md transition-colors shrink-0 ${
                                                        isActive
                                                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-800 dark:text-emerald-300'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}
                                                    title={isActive ? 'Tutup Counter' : 'Buka Counter'}
                                                >
                                                    {isActive ? <Power size={14} /> : <PowerOff size={14} />}
                                                </button>
                                            </div>

                                            {/* Active Flights List */}
                                            <div className="mt-3 space-y-2">
                                                {counter.flights && counter.flights.length > 0 ? (
                                                    counter.flights.map((flight) => (
                                                        <div
                                                            key={flight.id}
                                                            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700 relative group/flight"
                                                        >
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">
                                                                    {flight.nomor_penerbangan}
                                                                </span>
                                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                                                                    {flight.jam_jadwal.substring(0, 5)}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                                                To: {flight.airport_tujuan?.kota || flight.airport_tujuan?.nama_bandara || '-'}
                                                            </div>
                                                            <button
                                                                onClick={() => removeFlight(counter.id, flight.id)}
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
                                                onClick={() => openAssignModal(counter)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white transition border border-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-700/40"
                                            >
                                                <PlaneTakeoff size={12} /> Assign
                                            </button>
                                            <button
                                                onClick={() => openModal(counter)}
                                                className="p-2 rounded-lg text-gray-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <a
                                                href={`/public/gate/checkin/details?id=gate-${parseInt(String(counter.nomor_counter), 10) || counter.nomor_counter}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Buka Layar Display"
                                                className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                                            >
                                                <Eye size={14} />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(counter.id)}
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

            {/* Modal Form Tambah/Edit Counter */}
            {isModalOpen && !isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {selectedCounter ? 'Edit Counter' : 'Tambah Counter Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Counter</label>
                                <input
                                    type="text"
                                    value={data.nomor_counter}
                                    onChange={(e) => setData('nomor_counter', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                                {errors.nomor_counter && <p className="mt-1 text-sm text-red-600">{errors.nomor_counter}</p>}
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

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Maskapai Khusus (Opsional)</label>
                                <select
                                    value={data.airline_id}
                                    onChange={(e) => setData('airline_id', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">-- Bebas (Common Use) --</option>
                                    {airlines.map((a) => (
                                        <option key={a.id} value={a.id}>{a.nama}</option>
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
                                    className="flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50"
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
            {isAssignModalOpen && selectedCounter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Assign Penerbangan (Counter {selectedCounter.nomor_counter})
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Pilih penerbangan keberangkatan hari ini yang akan diarahkan ke counter ini. Ini akan otomatis membuka check-in.</p>

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
                                            {f.jam_jadwal.substring(0, 5)} - {f.nomor_penerbangan} ({f.airport_tujuan?.kode_iata || f.airport_tujuan?.kota || '-'})
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
                                    className="flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
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
