import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PlaneTakeoff, PlaneLanding, Clock, XCircle, Users, CheckCircle, ArrowRight, Plus, Cloud, Sun, Thermometer, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useServerClock, formatTimeInZone, formatDateInZone } from '@/hooks/useServerClock';
import ScoreNumber from '@/Components/ScoreNumber';
import RadarBackdrop from '@/Components/RadarBackdrop';

const OCEAN_GLASS_BG: React.CSSProperties = {
    background:
        'linear-gradient(135deg, rgba(6,182,212,0.20) 0%, rgba(14,116,144,0.25) 45%, rgba(15,118,110,0.20) 100%), rgba(8, 25, 45, 0.72)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
};

export default function Dashboard({ stats, hourly_data, recent_flights, weather, server_time, server_timezone, utc_time }: { stats: any, hourly_data: any, recent_flights: any, weather: any, server_time: string, server_timezone: string, utc_time: string }) {
    const currentTime = useServerClock(utc_time);

    const formatTime = (date: Date) => formatTimeInZone(date, server_timezone);
    const formatDate = (date: Date) => formatDateInZone(date, server_timezone);
    
    // Helper status color formatting for table
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delayed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'Boarding': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'Arrived':
            case 'Landed':
            case 'Departed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Dashboard FIDS
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-4">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* REAL-TIME CLOCK + WEATHER (radar + pink/purple) */}
                    <div
                        className="relative overflow-hidden rounded-3xl shadow-2xl p-6 text-white border border-cyan-400/20"
                        style={OCEAN_GLASS_BG}
                    >
                        <RadarBackdrop size={460} position="br" />
                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/10 ring-1 ring-cyan-300/25 backdrop-blur-md rounded-3xl">
                                    <Clock size={44} className="text-cyan-100 drop-shadow" />
                                </div>
                                <div>
                                    <p className="text-sm uppercase tracking-[0.24em] text-cyan-100/75">Waktu server</p>
                                    <div className="mt-2 text-5xl font-black tracking-tight tabular-nums drop-shadow-lg">{formatTime(currentTime)}</div>
                                    <p className="mt-2 text-sm text-cyan-100/75 flex items-center gap-2">
                                        <Calendar size={14} /> {formatDate(currentTime)}
                                    </p>
                                    <p className="text-sm text-cyan-100/75 mt-1">Zona waktu: <span className="font-semibold text-white">{server_timezone}</span></p>
                                </div>
                            </div>

                            {weather && (
                                <div className="flex flex-col gap-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-cyan-300/25 p-5 w-full lg:w-auto">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/15 ring-1 ring-cyan-300/25 rounded-3xl text-yellow-200 drop-shadow">
                                            {weather.kondisi_cuaca?.toLowerCase().includes('cerah') ? <Sun size={36} /> : <Cloud size={36} />}
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Cuaca</p>
                                            <p className="text-2xl font-semibold text-white">{weather.kondisi_cuaca}</p>
                                            <p className="text-sm text-cyan-100/75">{weather.kelembapan ?? '-'}% kelembapan • {weather.kecepatan_angin ?? '-'} km/jam{weather.arah_angin ? ` • ${weather.arah_angin}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-3xl bg-white/10 ring-1 ring-cyan-300/20 p-3">
                                            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Suhu</p>
                                            <p className="text-xl font-semibold text-white">{weather.suhu}°C</p>
                                        </div>
                                        <div className="rounded-3xl bg-white/10 ring-1 ring-cyan-300/20 p-3">
                                            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Angin</p>
                                            <p className="text-xl font-semibold text-white flex items-center gap-2">
                                                {(weather.arah_angin_derajat ?? null) !== null && (
                                                    <span
                                                        className="inline-block"
                                                        title={`${weather.arah_angin ?? ''} (${weather.arah_angin_derajat}°)`}
                                                        style={{ transform: `rotate(${weather.arah_angin_derajat}deg)` }}
                                                    >
                                                        →
                                                    </span>
                                                )}
                                                {weather.arah_angin ?? '-'}
                                            </p>
                                        </div>
                                        <div className="rounded-3xl bg-white/10 ring-1 ring-cyan-300/20 p-3">
                                            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Update terakhir</p>
                                            <p className="text-xl font-semibold text-white">{weather.updated_at ? new Date(weather.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* STAT CARDS â€” UNIFIED (radar + pink/purple) */}
                    <div
                        className="relative overflow-hidden shadow-xl sm:rounded-3xl border border-cyan-400/20"
                        style={OCEAN_GLASS_BG}
                    >
                        <RadarBackdrop size={420} position="br" />

                        {/* HEADER */}
                        <div className="relative flex items-center justify-between px-6 pt-5 pb-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Statistik penerbangan</p>
                                <h3 className="mt-1 text-lg font-semibold text-white drop-shadow">Ikhtisar status hari ini</h3>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 px-3 py-1 text-xs font-medium text-cyan-50">
                                <Calendar size={12} /> {formatDate(currentTime)}
                            </span>
                        </div>

                        <div className="relative grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-y sm:divide-y-0 sm:divide-x divide-white/10 border-t border-white/10">
                            {[
                                { label: 'Total',         short: 'Total',     value: stats.total_flights,                  icon: PlaneTakeoff },
                                { label: 'Berangkat',     short: 'Berangkat', value: stats.total_departures,               icon: PlaneTakeoff },
                                { label: 'Datang',        short: 'Datang',    value: stats.total_arrivals,                 icon: PlaneLanding },
                                { label: 'Terjadwal',     short: 'Jadwal',    value: stats.scheduled,                      icon: Clock },
                                { label: 'Boarding',      short: 'Boarding',  value: stats.boarding,                       icon: Users },
                                { label: 'Dibatalkan',    short: 'Cancel',    value: stats.cancelled,                      icon: XCircle },
                                { label: 'Selesai',       short: 'Selesai',   value: stats.arrived + stats.departed,       icon: CheckCircle },
                                { label: 'Maskapai',      short: 'Maskapai',  value: stats.active_airlines,                icon: Plus },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className="flex flex-col items-center text-center px-2 py-4">
                                        <div className="p-2 rounded-xl bg-white/10 ring-1 ring-cyan-300/25 text-cyan-100 backdrop-blur-md">
                                            <Icon size={16} />
                                        </div>
                                        <ScoreNumber value={item.value} minDigits={2} className="mt-2 text-2xl sm:text-3xl font-bold text-white" />
                                        <p className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-cyan-100/75 leading-tight" title={item.label}>
                                            <span className="sm:hidden">{item.short}</span>
                                            <span className="hidden sm:inline">{item.label}</span>
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* CHART & QUICK ACTIONS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Area Chart Activity */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Aktivitas Penerbangan per Jam</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={hourly_data}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorArr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '0.5rem' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                        <Area type="monotone" name="Keberangkatan" dataKey="keberangkatan" stroke="#10b981" fillOpacity={1} fill="url(#colorDep)" strokeWidth={2} />
                                        <Area type="monotone" name="Kedatangan" dataKey="kedatangan" stroke="#6366f1" fillOpacity={1} fill="url(#colorArr)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Operational Summary */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Ringkasan Operasional</h3>

                            <div className="grid grid-cols-1 gap-3 mb-6">
                                <Link href={route('admin.departures.index')} className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <div className="flex items-center text-gray-700 dark:text-gray-200 font-medium">
                                        <PlaneTakeoff size={18} className="mr-3 text-green-500" />
                                        Keberangkatan hari ini
                                    </div>
                                    <ArrowRight size={16} className="text-gray-400 group-hover:text-green-500 transform group-hover:translate-x-1 transition-all" />
                                </Link>
                                <Link href={route('admin.arrivals.index')} className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <div className="flex items-center text-gray-700 dark:text-gray-200 font-medium">
                                        <PlaneLanding size={18} className="mr-3 text-indigo-500" />
                                        Kedatangan hari ini
                                    </div>
                                    <ArrowRight size={16} className="text-gray-400 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
                                </Link>
                            </div>

                            <div className="bg-white dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm mb-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Log Penerbangan</p>
                                        <h4 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Export PDF Status Terbaru</h4>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Unduh log perubahan status penerbangan hari ini dalam format PDF.</p>
                                    </div>
                                    <div className="shrink-0">
                                        <a
                                            href={route('admin.dashboard.export-flight-logs')}
                                            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                                        >
                                            Export PDF
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl">
                                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Gate aktif</p>
                                    <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{stats.gates_assigned}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl">
                                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Check-in aktif</p>
                                    <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{stats.checkin_counters}</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* UPCOMING FLIGHTS TABLE */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Penerbangan Mendatang</h3>
                            <Link href={route('admin.departures.index')} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                                Lihat Semua <ArrowRight size={14} className="ml-1" />
                            </Link>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Jadwal</th>
                                        <th className="px-4 py-3">Penerbangan</th>
                                        <th className="px-4 py-3">Rute</th>
                                        <th className="px-4 py-3">Jenis</th>
                                        <th className="px-4 py-3 rounded-tr-lg text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_flights && recent_flights.length > 0 ? (
                                        recent_flights.map((flight: any) => (
                                            <tr key={flight.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                    {flight.jam_jadwal?.substring(0, 5)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center font-medium text-gray-900 dark:text-white">
                                                        {flight.airline?.logo ? (
                                                            <img src={`/storage/${flight.airline.logo}`} alt="Logo" className="w-5 h-5 object-contain mr-2" />
                                                        ) : (
                                                            <PlaneTakeoff size={16} className="mr-2 text-gray-400" />
                                                        )}
                                                        {flight.nomor_penerbangan}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {flight.airport_asal?.kode_iata || '---'} → {flight.airport_tujuan?.kode_iata || '---'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {flight.airport_asal?.kota || '-'} → {flight.airport_tujuan?.kota || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {flight.jenis_penerbangan === 'departure' ? (
                                                        <span className="inline-flex items-center text-green-600 dark:text-green-400">
                                                            <PlaneTakeoff size={14} className="mr-1" /> Dept
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-indigo-600 dark:text-indigo-400">
                                                            <PlaneLanding size={14} className="mr-1" /> Arr
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(flight.status)}`}>
                                                        {flight.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                                Belum ada data penerbangan mendatang untuk hari ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
