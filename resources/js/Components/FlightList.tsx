import { useMemo, useState } from 'react';
import { Edit, Trash, PlaneTakeoff, PlaneLanding, Clock, ArrowRight, Search, Building2 } from 'lucide-react';

type Flight = {
    id: number;
    tanggal_penerbangan?: string | null;
    nomor_penerbangan: string;
    jam_jadwal: string;
    jam_estimasi?: string | null;
    jam_aktual?: string | null;
    status: string;
    catatan?: string | null;
    hari_operasi?: string[] | null;
    airline?: { id?: number; nama_maskapai?: string; logo?: string | null; warna_identitas?: string | null } | null;
    airport_asal?: { kode_iata?: string; kota?: string; nama_bandara?: string } | null;
    airport_tujuan?: { kode_iata?: string; kota?: string; nama_bandara?: string } | null;
    gate?: { kode_gate?: string; terminal?: string } | null;
    baggage_claim?: { nomor_belt?: string | number } | null;
    checkin_counter?: { nomor_counter?: string | number } | null;
    checkin_counters?: { id?: number; nomor_counter?: string | number }[] | null;
};

interface Props {
    flights: Flight[];
    isDaily: boolean;
    airlines?: any[];
    airports?: any[];
    formatTanggal: (s?: string | null) => string;
    onEdit: (f: Flight) => void;
    onDelete: (id: number) => void;
    kind: 'departure' | 'arrival';
}

const STATUS_PALETTE: Record<string, { chip: string; bar: string; label?: string }> = {
    Scheduled:        { chip: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200',         bar: 'from-slate-400 to-zinc-400' },
    'On Time':        { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', bar: 'from-emerald-400 to-teal-400' },
    'Check-in Open':  { chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',                 bar: 'from-sky-400 to-cyan-400' },
    'Check-in Closed':{ chip: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300',         bar: 'from-slate-400 to-stone-400' },
    Boarding:         { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', bar: 'from-emerald-500 to-cyan-500' },
    Departed:         { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', bar: 'from-emerald-500 to-teal-500' },
    Landed:           { chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',                 bar: 'from-sky-500 to-blue-500' },
    Arrived:          { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', bar: 'from-emerald-500 to-green-500' },
    'Baggage Claim':  { chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',     bar: 'from-violet-500 to-fuchsia-500' },
    Delayed:          { chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',         bar: 'from-amber-500 to-orange-500' },
    Cancelled:        { chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',             bar: 'from-rose-500 to-pink-500' },
};

function statusOf(s: string) {
    return STATUS_PALETTE[s] ?? STATUS_PALETTE.Scheduled;
}

function timeShort(t?: string | null) {
    if (!t) return null;
    return t.length >= 5 ? t.substring(0, 5) : t;
}

function airlineInitials(name?: string | null) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

export default function FlightList({ flights, isDaily, formatTanggal, onEdit, onDelete, kind }: Props) {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filtered = useMemo(() => {
        return flights.filter((f) => {
            if (statusFilter !== 'all' && f.status !== statusFilter) return false;
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                f.nomor_penerbangan?.toLowerCase().includes(q) ||
                f.airline?.nama_maskapai?.toLowerCase().includes(q) ||
                f.airport_asal?.kode_iata?.toLowerCase().includes(q) ||
                f.airport_tujuan?.kode_iata?.toLowerCase().includes(q) ||
                f.airport_asal?.kota?.toLowerCase().includes(q) ||
                f.airport_tujuan?.kota?.toLowerCase().includes(q)
            );
        });
    }, [flights, query, statusFilter]);

    const statusOptions = useMemo(() => {
        const set = new Set<string>();
        flights.forEach((f) => f.status && set.add(f.status));
        return Array.from(set).sort();
    }, [flights]);

    const KindIcon = kind === 'departure' ? PlaneTakeoff : PlaneLanding;
    const accent = kind === 'departure' ? 'sky' : 'emerald';
    const accentColors: Record<string, string> = {
        sky: 'text-sky-600 dark:text-sky-300',
        emerald: 'text-emerald-600 dark:text-emerald-300',
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari nomor penerbangan, maskapai, atau kota..."
                        className="pl-9 pr-3 py-1.5 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-fuchsia-500 focus:ring focus:ring-fuchsia-500/20"
                    />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            statusFilter === 'all'
                                ? 'bg-white dark:bg-gray-700 text-fuchsia-700 dark:text-fuchsia-200 shadow'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Semua ({flights.length})
                    </button>
                    {statusOptions.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                statusFilter === s
                                    ? `bg-white dark:bg-gray-700 ${accentColors[accent]} shadow`
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${accent === 'sky' ? 'bg-sky-50 dark:bg-sky-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
                        <KindIcon size={28} className={accentColors[accent]} />
                    </div>
                    <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                        {flights.length === 0 ? 'Belum ada jadwal' : 'Tidak ada hasil'}
                    </h5>
                    <p className="text-sm text-gray-500 mt-1 max-w-md">
                        {flights.length === 0
                            ? 'Klik "Tambah Data" untuk menambahkan jadwal penerbangan.'
                            : 'Coba ubah kata kunci atau filter status.'}
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {filtered.map((flight) => {
                        const sp = statusOf(flight.status);
                        const eta = timeShort(flight.jam_estimasi || undefined);
                        const ata = timeShort(flight.jam_aktual || undefined);
                        const isDelayed = flight.status === 'Delayed' || (eta && eta !== timeShort(flight.jam_jadwal));
                        return (
                            <li key={flight.id} className="group relative hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition">
                                {/* status stripe */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${sp.bar} opacity-80`} />

                                <div className="grid grid-cols-12 gap-3 items-center px-5 py-4 pl-6">
                                    {/* time */}
                                    <div className="col-span-3 sm:col-span-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                accent === 'sky'
                                                    ? 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white'
                                                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                                            } shadow`}>
                                                <Clock size={16} />
                                            </div>
                                            <div className="leading-none">
                                                <div className="text-lg font-black tabular-nums tracking-tight text-gray-900 dark:text-white">
                                                    {timeShort(flight.jam_jadwal)}
                                                </div>
                                                {(eta || ata) && (
                                                    <div className="text-[10px] uppercase tracking-widest font-semibold mt-1">
                                                        {ata ? (
                                                            <span className="text-emerald-600 dark:text-emerald-400">ATA {ata}</span>
                                                        ) : (
                                                            <span className={isDelayed ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}>
                                                                ETA {eta}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* flight info */}
                                    <div className="col-span-9 sm:col-span-3 flex items-center gap-3 min-w-0">
                                        <div className="shrink-0">
                                            {flight.airline?.logo ? (
                                                <img
                                                    src={flight.airline.logo.startsWith('http') ? flight.airline.logo : `/storage/${flight.airline.logo}`}
                                                    alt=""
                                                    className="w-10 h-10 rounded-xl object-contain bg-white ring-1 ring-gray-200 dark:ring-gray-700 p-1"
                                                />
                                            ) : (
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow"
                                                    style={{ backgroundColor: flight.airline?.warna_identitas || '#475569' }}
                                                >
                                                    {airlineInitials(flight.airline?.nama_maskapai)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">
                                                {flight.nomor_penerbangan}
                                            </div>
                                            <div className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                                                <Building2 size={10} /> {flight.airline?.nama_maskapai ?? '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* route */}
                                    <div className="col-span-12 sm:col-span-4 flex items-center gap-2 text-sm">
                                        <div className="text-right shrink-0">
                                            <div className="font-black text-gray-900 dark:text-white tracking-tight">{flight.airport_asal?.kode_iata ?? '-'}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider truncate max-w-[100px]">{flight.airport_asal?.kota ?? ''}</div>
                                        </div>
                                        <div className="flex flex-col items-center px-2">
                                            <div className={`h-px w-12 sm:w-16 bg-gradient-to-r ${sp.bar}`} />
                                            <ArrowRight size={14} className={`-mt-2 ${accentColors[accent]}`} />
                                        </div>
                                        <div className="shrink-0">
                                            <div className="font-black text-gray-900 dark:text-white tracking-tight">{flight.airport_tujuan?.kode_iata ?? '-'}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider truncate max-w-[100px]">{flight.airport_tujuan?.kota ?? ''}</div>
                                        </div>
                                    </div>

                                    {/* status + extra meta */}
                                    <div className="col-span-9 sm:col-span-2 flex flex-col items-start gap-1.5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sp.chip}`}>
                                            {flight.status}
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            {flight.gate?.kode_gate && (
                                                <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                    Gate {flight.gate.kode_gate}
                                                </span>
                                            )}
                                            {flight.baggage_claim?.nomor_belt && (
                                                <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                                                    Belt {flight.baggage_claim.nomor_belt}
                                                </span>
                                            )}
                                            {(() => {
                                                // Master menyimpan counter lewat relasi jamak (pivot).
                                                // Fallback ke relasi tunggal bila ada (data lama).
                                                const counters = (flight.checkin_counters && flight.checkin_counters.length > 0)
                                                    ? flight.checkin_counters.map((c) => c.nomor_counter).filter(Boolean)
                                                    : (flight.checkin_counter?.nomor_counter ? [flight.checkin_counter.nomor_counter] : []);
                                                return counters.length > 0 ? (
                                                    <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                                                        {counters.length > 1 ? 'CT' : 'Counter'} {counters.join(', ')}
                                                    </span>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>

                                    {/* actions */}
                                    <div className="col-span-3 sm:col-span-1 flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => onEdit(flight)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/30 transition"
                                            title="Edit"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(flight.id)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                            title="Hapus"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>

                                    {/* sub row: hari_operasi (master) atau tanggal (daily) */}
                                    <div className="col-span-12 flex items-center gap-2 pl-12 -mt-1">
                                        {isDaily ? (
                                            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">
                                                {formatTanggal(flight.tanggal_penerbangan)}
                                            </span>
                                        ) : flight.hari_operasi && flight.hari_operasi.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {flight.hari_operasi.map((d) => (
                                                    <span key={d} className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                        {d.substring(0, 3)}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : null}
                                        {flight.catatan && (
                                            <span className="text-[10px] italic text-gray-400 truncate max-w-[40ch]">
                                                "{flight.catatan}"
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
