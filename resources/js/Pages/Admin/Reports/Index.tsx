import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FileSpreadsheet, FileDown, PlaneTakeoff, PlaneLanding, Calendar, Filter, CheckCircle2, Clock as ClockIcon, XCircle } from 'lucide-react';

type Flight = {
    id: number;
    tanggal_penerbangan: string;
    jam_jadwal: string | null;
    jam_estimasi: string | null;
    jam_aktual: string | null;
    nomor_penerbangan: string;
    status: string;
    catatan: string | null;
    airline: { nama_maskapai: string; logo: string | null } | null;
    airport_asal: { kode_iata: string; nama_bandara: string; kota: string } | null;
    airport_tujuan: { kode_iata: string; nama_bandara: string; kota: string } | null;
    gate: { kode_gate: string } | null;
    baggage_claim: { nomor_belt: string } | null;
};

type Props = {
    mode: 'departure' | 'arrival';
    flights: Flight[];
    filters: { start: string; end: string };
    summary: { total: number; on_time: number; delayed: number; cancelled: number };
    server_timezone: string;
};

const statusColor = (status: string) => {
    switch (status) {
        case 'Departed':
        case 'Arrived':
        case 'Landed':
            return 'bg-emerald-100 text-emerald-700';
        case 'Boarding':
        case 'Final Call':
        case 'Gate Open':
            return 'bg-purple-100 text-purple-700';
        case 'Delayed':
            return 'bg-yellow-100 text-yellow-700';
        case 'Cancelled':
            return 'bg-red-100 text-red-700';
        case 'Check-in Open':
            return 'bg-sky-100 text-sky-700';
        default:
            return 'bg-blue-100 text-blue-700';
    }
};

export default function Index({ mode, flights, filters, summary, server_timezone }: Props) {
    const [start, setStart] = useState(filters.start);
    const [end, setEnd] = useState(filters.end);

    const isDeparture = mode === 'departure';
    const Icon = isDeparture ? PlaneTakeoff : PlaneLanding;
    const title = isDeparture ? 'Report Keberangkatan' : 'Report Kedatangan';
    const baseRoute = isDeparture ? 'admin.reports.departures' : 'admin.reports.arrivals';
    const pdfRoute = isDeparture ? 'admin.reports.departures.pdf' : 'admin.reports.arrivals.pdf';

    const applyFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route(baseRoute), { start, end }, { preserveScroll: true, preserveState: false });
    };

    const setQuickRange = (mode: 'today' | '7d' | '30d') => {
        const today = new Date();
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        const e = fmt(today);
        const s = mode === 'today' ? e
            : mode === '7d' ? fmt(new Date(today.getTime() - 6 * 86400000))
            : fmt(new Date(today.getTime() - 29 * 86400000));
        setStart(s); setEnd(e);
        router.get(route(baseRoute), { start: s, end: e }, { preserveScroll: true, preserveState: false });
    };

    const pdfHref = `${route(pdfRoute)}?start=${start}&end=${end}`;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">{title}</h2>
            }
        >
            <Head title={title} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <SummaryCard label="Total" value={summary.total} icon={<Icon size={18} />} color="indigo" />
                        <SummaryCard label="On-Time" value={summary.on_time} icon={<CheckCircle2 size={18} />} color="emerald" />
                        <SummaryCard label="Delayed" value={summary.delayed} icon={<ClockIcon size={18} />} color="yellow" />
                        <SummaryCard label="Cancelled" value={summary.cancelled} icon={<XCircle size={18} />} color="red" />
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <form onSubmit={applyFilter} className="flex flex-wrap items-end gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Dari</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        className="pl-8 rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={start}
                                        onChange={(e) => setStart(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Sampai</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        className="pl-8 rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={end}
                                        onChange={(e) => setEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700"
                            >
                                <Filter size={14} /> Terapkan
                            </button>

                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-xs text-gray-500 mr-1">Cepat:</span>
                                <button type="button" onClick={() => setQuickRange('today')} className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50">Hari ini</button>
                                <button type="button" onClick={() => setQuickRange('7d')} className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50">7 hari</button>
                                <button type="button" onClick={() => setQuickRange('30d')} className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50">30 hari</button>
                                <a
                                    href={pdfHref}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-md hover:bg-rose-700"
                                >
                                    <FileDown size={14} /> Export PDF
                                </a>
                            </div>
                        </form>

                        <p className="mt-3 text-xs text-gray-500">
                            Zona waktu: <span className="font-mono">{server_timezone}</span> · Menampilkan {summary.total} penerbangan
                        </p>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg ${isDeparture ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'} flex items-center justify-center`}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{title}</h3>
                                <p className="text-xs text-gray-500">Daftar penerbangan dalam rentang tanggal yang dipilih</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                                    <tr>
                                        <th className="px-3 py-3 text-left">Tanggal</th>
                                        <th className="px-3 py-3 text-left">Jadwal</th>
                                        <th className="px-3 py-3 text-left">Estimasi</th>
                                        <th className="px-3 py-3 text-left">Aktual</th>
                                        <th className="px-3 py-3 text-left">Penerbangan</th>
                                        <th className="px-3 py-3 text-left">Maskapai</th>
                                        <th className="px-3 py-3 text-left">{isDeparture ? 'Tujuan' : 'Asal'}</th>
                                        <th className="px-3 py-3 text-left">{isDeparture ? 'Gate' : 'Belt'}</th>
                                        <th className="px-3 py-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flights.length === 0 ? (
                                        <tr><td colSpan={9} className="px-3 py-12 text-center text-gray-400">
                                            <FileSpreadsheet size={28} className="mx-auto mb-2 text-gray-300" />
                                            Tidak ada data dalam rentang tanggal ini
                                        </td></tr>
                                    ) : flights.map(f => {
                                        const ap = isDeparture ? f.airport_tujuan : f.airport_asal;
                                        return (
                                            <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{f.tanggal_penerbangan?.substring(0, 10)}</td>
                                                <td className="px-3 py-3 font-mono text-gray-900">{f.jam_jadwal?.substring(0, 5) ?? '-'}</td>
                                                <td className="px-3 py-3 font-mono text-gray-600">{f.jam_estimasi?.substring(0, 5) ?? '-'}</td>
                                                <td className="px-3 py-3 font-mono text-gray-600">{f.jam_aktual?.substring(0, 5) ?? '-'}</td>
                                                <td className="px-3 py-3 font-semibold text-gray-900">{f.nomor_penerbangan}</td>
                                                <td className="px-3 py-3 text-gray-700">{f.airline?.nama_maskapai ?? '-'}</td>
                                                <td className="px-3 py-3 text-gray-700">
                                                    <div className="font-medium">{ap?.kode_iata ?? '---'}</div>
                                                    <div className="text-xs text-gray-500">{ap?.kota ?? '-'}</div>
                                                </td>
                                                <td className="px-3 py-3 text-gray-700">{isDeparture ? (f.gate?.kode_gate ?? '-') : (f.baggage_claim?.nomor_belt ?? '-')}</td>
                                                <td className="px-3 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(f.status)}`}>{f.status}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'indigo' | 'emerald' | 'yellow' | 'red' }) {
    const palette = {
        indigo: 'bg-indigo-100 text-indigo-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        yellow: 'bg-yellow-100 text-yellow-700',
        red: 'bg-red-100 text-red-700',
    }[color];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${palette}`}>{icon}</div>
            <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
            </div>
        </div>
    );
}
