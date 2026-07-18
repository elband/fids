import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TimeInput24 from '@/Components/TimeInput24';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Edit, Trash, Plus, Monitor, RefreshCw, CalendarCheck, PlaneLanding, Database } from 'lucide-react';
import FlightList from '@/Components/FlightList';
import { appConfirm } from '@/lib/confirm';

const getLocalDateString = () => {
    // Use server timezone for consistent date across all clients
    const tz = (window as any).__fids_server_timezone || 'Asia/Makassar';
    const now = new Date();
    return new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(now);
};

export default function Index({ 
    flights, 
    airlines, 
    airports, 
    gates, 
    checkinCounters, 
    baggageClaims, 
    routes, 
    isDaily = false, 
    server_timezone = 'Asia/Makassar', 
    utc_now = new Date().toISOString(), 
    today_name = '', 
    today_date = '',
    current_filter_day = '',
    available_days = [],
    airplanes = []
}: any) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    // Auto-refresh logic
    useEffect(() => {
        // 1. Regular 5-minute refresh
        const interval = setInterval(() => {
            router.reload({ only: ['flights', 'today_name', 'today_date'] });
            setLastRefresh(new Date());
        }, 5 * 60 * 1000);

        // 2. Scheduled 1 AM refresh
        const checkOneAM = setInterval(() => {
            // Use server timezone to determine current hour
            const nowInTz = new Intl.DateTimeFormat('en-GB', { timeZone: server_timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
            const [hourStr, minStr] = nowInTz.split(':');
            const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: server_timezone }).format(new Date());
            const lastOneAM = sessionStorage.getItem('last_1am_refresh_arr');

            if (hourStr === '01' && minStr === '00' && lastOneAM !== todayStr) {
                sessionStorage.setItem('last_1am_refresh_arr', todayStr);
                router.reload();
                setLastRefresh(new Date());
            }
        }, 60000); // Check every minute

        return () => {
            clearInterval(interval);
            clearInterval(checkOneAM);
        };
    }, [isDaily]);

    const handleManualRefresh = () => {
        router.reload({ onSuccess: () => setLastRefresh(new Date()) });
    };

    const handleDayFilterChange = (day: string) => {
        router.get(route(isDaily ? 'admin.daily-arrivals.index' : 'admin.arrivals.index'),
            { day: day },
            {}
        );
    };

    const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        tanggal_penerbangan: getLocalDateString(),
        nomor_penerbangan: '',
        airline_id: '',
        airport_asal_id: '',
        airport_tujuan_id: '',
        jam_jadwal: '',
        jam_estimasi: '',
        jam_aktual: '',
        jenis_penerbangan: 'arrival',
        tipe_layanan: 'domestik',
        gate_id: '',
        checkin_counter_id: '',
        baggage_claim_id: '',
        status: 'Scheduled',
        catatan: '',
        hari_operasi: [] as string[],
        frekuensi_per_minggu: 0,
    });

    const [filteredAirplanes, setFilteredAirplanes] = useState(airplanes);
    const [selectedAirplaneId, setSelectedAirplaneId] = useState('');

    useEffect(() => {
        if (data.airline_id) {
            setFilteredAirplanes(airplanes.filter((a: any) => a.airline_id === parseInt(data.airline_id)));
        } else {
            setFilteredAirplanes(airplanes);
        }
    }, [data.airline_id, airplanes]);

    const handleAirplaneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const airplaneId = e.target.value;
        setSelectedAirplaneId(airplaneId);
        if (airplaneId) {
            const airplane = airplanes.find((a: any) => a.id === parseInt(airplaneId));
            if (airplane) {
                setData({
                    ...data,
                    nomor_penerbangan: airplane.nomor_registrasi,
                    airline_id: airplane.airline_id.toString(),
                });
            }
        }
    };

    const normalizeHariOperasi = (raw: any): string[] => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string' && raw.trim() !== '') {
            const t = raw.trim();
            if (t.startsWith('[')) {
                try { const j = JSON.parse(t); return Array.isArray(j) ? j : []; } catch { return []; }
            }
            return t.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [];
    };

    const openModal = (flight: any = null) => {
        if (flight) {
            setEditingId(flight.id);
            const matchingAirplane = airplanes.find((a: any) => a.nomor_registrasi === flight.nomor_penerbangan);
            setSelectedAirplaneId(matchingAirplane ? matchingAirplane.id.toString() : '');
            setData({
                // Nilai form = tanggal mentah (YYYY-MM-DD) atau kosong utk master.
                // JANGAN pakai formatTanggal() yg mengembalikan '-' saat null → gagal validasi date.
                tanggal_penerbangan: flight.tanggal_penerbangan ? String(flight.tanggal_penerbangan).substring(0, 10) : '',
                nomor_penerbangan: flight.nomor_penerbangan,
                airline_id: flight.airline_id,
                airport_asal_id: flight.airport_asal_id,
                airport_tujuan_id: flight.airport_tujuan_id,
                jam_jadwal: flight.jam_jadwal,
                jam_estimasi: flight.jam_estimasi || '',
                jam_aktual: flight.jam_aktual || '',
                jenis_penerbangan: flight.jenis_penerbangan,
                tipe_layanan: flight.tipe_layanan,
                gate_id: flight.gate_id || '',
                checkin_counter_id: flight.checkin_counter_id || '',
                baggage_claim_id: flight.baggage_claim_id || '',
                status: flight.status,
                catatan: flight.catatan || '',
                hari_operasi: normalizeHariOperasi(flight.hari_operasi),
                frekuensi_per_minggu: flight.frekuensi_per_minggu || 0,
            });
        } else {
            setEditingId(null);
            setSelectedAirplaneId('');
            reset();
            setData('tanggal_penerbangan', getLocalDateString());
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const routePrefix = isDaily ? 'admin.daily-arrivals' : 'admin.arrivals';
        
        if (editingId) {
            put(route(`${routePrefix}.update`, editingId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route(`${routePrefix}.store`), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const deleteFlight = async (id: number) => {
        const routePrefix = isDaily ? 'admin.daily-arrivals' : 'admin.arrivals';
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Jadwal Penerbangan',
            message: 'Apakah Anda yakin ingin menghapus jadwal kedatangan ini?',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route(`${routePrefix}.destroy`, id));
    };

    const pullDataMaster = async () => {
        const ok = await appConfirm({
            variant: 'info',
            title: 'Tarik Master Penerbangan',
            message: 'Data yang sudah ada tidak akan diduplikasi. Apakah Anda yakin ingin menarik data master untuk hari ini?',
            confirmText: 'Ya, Tarik Master',
            cancelText: 'Batal',
        });
        if (!ok) return;
        post(route('admin.daily-arrivals.pull'));
    };

    const toggleDay = (day: string) => {
        let newDays = [...data.hari_operasi];
        if (newDays.includes(day)) {
            newDays = newDays.filter(d => d !== day);
        } else {
            newDays.push(day);
        }
        setData('hari_operasi', newDays);
        setData('frekuensi_per_minggu', newDays.length);
    };

    // Helper to find names
    const getAirlineName = (id: number) => airlines.find((a: any) => a.id === id)?.nama_maskapai || '-';
    const getAirportCode = (id: number) => airports.find((a: any) => a.id === id)?.kode_iata || '-';

    const formatTanggal = (value: string | null | undefined) => {
        if (!value) return '-';
        // Ambil langsung YYYY-MM-DD tanpa konversi timezone
        // karena tanggal penerbangan adalah date-only (bukan datetime)
        const str = String(value);
        if (str.length >= 10) return str.substring(0, 10);
        return str;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    {isDaily ? 'Kedatangan (Hari Ini)' : 'Master Kedatangan'}
                </h2>
            }
        >
            <Head title={isDaily ? 'Kedatangan (Hari Ini)' : 'Master Kedatangan'} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    {/* HERO */}
                    <div className="relative overflow-hidden rounded-3xl shadow-xl border border-white/10 bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-600 text-white">
                        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-300/30 blur-3xl" />
                        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-cyan-300/30 blur-3xl" />
                        <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
                            backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px',
                        }} />
                        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 lg:p-8">
                            <div className="lg:col-span-2 space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 text-[11px] font-bold uppercase tracking-[0.2em]">
                                    <PlaneLanding size={12} /> {isDaily ? 'Operasional' : 'Master Schedule'}
                                </div>
                                <h3 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">
                                    {isDaily ? 'Kedatangan Hari Ini' : 'Master Jadwal Kedatangan'}
                                </h3>
                                {isDaily ? (
                                    <p className="text-sm lg:text-base text-white/85 max-w-xl">
                                        Jadwal penerbangan datang untuk tanggal <span className="font-bold">{formatTanggal(today_date)}</span>.
                                        Data sinkron otomatis tiap 5 menit dan refresh ulang pada pukul 01.00 WITA.
                                    </p>
                                ) : (
                                    <p className="text-sm lg:text-base text-white/85 max-w-xl">
                                        Database master jadwal penerbangan datang per hari operasi. Data ini menjadi sumber jadwal harian.
                                    </p>
                                )}

                                {/* meta row */}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    {today_name && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 text-xs font-bold">
                                            <CalendarCheck size={12} /> Hari ini: {today_name}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 text-xs font-semibold">
                                        <PlaneLanding size={12} /> {flights?.total ?? flights.data.length} jadwal
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur ring-1 ring-white/20 text-[11px] font-medium text-white/80">
                                        <RefreshCw size={11} className={processing ? 'animate-spin' : ''} />
                                        Update {lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {!isDaily && (
                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <span className="text-[11px] uppercase tracking-widest text-white/70 font-bold">Filter Hari:</span>
                                        <select
                                            value={current_filter_day}
                                            onChange={(e) => handleDayFilterChange(e.target.value)}
                                            className="text-xs rounded-lg border-white/20 bg-white/10 backdrop-blur text-white py-1.5 pl-3 pr-8 focus:ring-emerald-300"
                                        >
                                            <option value="Semua" className="text-gray-900">Semua Hari</option>
                                            {available_days.map((day: string) => (
                                                <option key={day} value={day} className="text-gray-900">{day}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 justify-end">
                                <button
                                    onClick={() => openModal()}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0"
                                >
                                    <Plus size={16} /> Tambah Data
                                </button>
                                <a
                                    href={route('display.arrival')}
                                    target="_blank"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/25 text-white font-semibold hover:bg-white/20 transition"
                                >
                                    <Monitor size={16} /> Monitor TV
                                </a>
                                {isDaily && (
                                    <button
                                        onClick={pullDataMaster}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/30 backdrop-blur ring-1 ring-white/20 text-white font-semibold hover:bg-emerald-900/50 transition"
                                    >
                                        <Database size={16} /> Tarik Master
                                    </button>
                                )}
                                <button
                                    onClick={handleManualRefresh}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur ring-1 ring-white/15 text-white/90 text-sm font-semibold hover:bg-white/10 transition"
                                >
                                    <RefreshCw size={14} className={processing ? 'animate-spin' : ''} /> Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* LIST */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <FlightList
                            flights={flights.data}
                            isDaily={isDaily}
                            airlines={airlines}
                            airports={airports}
                            formatTanggal={formatTanggal}
                            onEdit={openModal}
                            onDelete={deleteFlight}
                            kind="arrival"
                        />
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                            {editingId ? 'Edit Kedatangan' : 'Tambah Kedatangan'}
                        </h3>
                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.keys(errors).length > 0 && (
                                <div className="col-span-1 md:col-span-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                                    <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Terdapat kesalahan pada data:</p>
                                    <ul className="text-xs text-red-600 dark:text-red-300 space-y-0.5 list-disc list-inside">
                                        {Object.values(errors).map((error, i) => (
                                            <li key={i}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Kiri */}
                            <div className="space-y-4">
                                {isDaily ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tgl Penerbangan</label>
                                        <input type="date" value={data.tanggal_penerbangan} disabled className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed" />
                                    </div>
                                ) : (
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hari Operasi</label>
                                        <div className="flex flex-wrap gap-2">
                                            {daysOfWeek.map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(day)}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                                        data.hari_operasi.includes(day)
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-3">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frekuensi (kali/minggu)</label>
                                            <input type="number" value={data.frekuensi_per_minggu} readOnly className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-100 dark:text-gray-600 dark:bg-gray-800/50" />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Pesawat (Opsional)</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-sm"
                                        onChange={handleAirplaneChange}
                                        value={selectedAirplaneId}
                                    >
                                        <option value="">-- Gunakan Data Pesawat --</option>
                                        {filteredAirplanes.map((airplane: any) => (
                                            <option key={airplane.id} value={airplane.id}>
                                                {airplane.nomor_registrasi} ({airplane.tipe_pesawat})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-1 italic">*Mengisi No. Flight & Maskapai otomatis</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Penerbangan</label>
                                    <input type="text" placeholder="e.g. GA-123 atau PK-SNT" value={data.nomor_penerbangan} onChange={e => setData('nomor_penerbangan', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Maskapai</label>
                                    <select value={data.airline_id} onChange={e => setData('airline_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required>
                                        <option value="">Pilih Maskapai</option>
                                        {airlines.map((a: any) => <option key={a.id} value={a.id}>{a.nama_maskapai}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Rute</label>
                                    <select 
                                        value={routes.find((r: any) => r.airport_asal_id == data.airport_asal_id && r.airport_tujuan_id == data.airport_tujuan_id)?.id || ''} 
                                        onChange={e => {
                                            const route = routes.find((r: any) => r.id == e.target.value);
                                            if (route) {
                                                setData(d => ({
                                                    ...d,
                                                    airport_asal_id: route.airport_asal_id,
                                                    airport_tujuan_id: route.airport_tujuan_id,
                                                    tipe_layanan: route.tipe_layanan,
                                                }));
                                            }
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                        required
                                    >
                                        <option value="">Pilih Rute</option>
                                        {routes.map((r: any) => (
                                            <option key={r.id} value={r.id}>
                                                {r.airport_asal?.kode_iata} &rarr; {r.airport_tujuan?.kode_iata} ({r.tipe_layanan})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2 opacity-60">
                                    <div className="w-1/2">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Asal (Auto)</label>
                                        <input type="text" readOnly value={airports.find((a: any) => a.id == data.airport_asal_id)?.nama_bandara || '-'} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 text-xs" />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Tujuan (Auto)</label>
                                        <input type="text" readOnly value={airports.find((a: any) => a.id == data.airport_tujuan_id)?.nama_bandara || '-'} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 text-xs" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-1/2 hidden">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jenis</label>
                                        <select value={data.jenis_penerbangan} onChange={e => setData('jenis_penerbangan', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required>
                                            <option value="arrival">Kedatangan</option>
                                        </select>
                                    </div>
                                    <div className="w-full">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Layanan</label>
                                        <select value={data.tipe_layanan} onChange={e => setData('tipe_layanan', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required>
                                            <option value="domestik">Domestik</option>
                                            <option value="internasional">Internasional</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Kanan */}
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jadwal</label>
                                        <TimeInput24 value={data.jam_jadwal} onChange={v => setData('jam_jadwal', v)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-2 py-1" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimasi</label>
                                        <TimeInput24 value={data.jam_estimasi} onChange={v => setData('jam_estimasi', v)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-2 py-1" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aktual</label>
                                        <TimeInput24 value={data.jam_aktual} onChange={v => setData('jam_aktual', v)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-2 py-1" />
                                    </div>
                                </div>
                                
                                {isDaily && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                        <select value={data.status} onChange={e => setData('status', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white font-semibold" required>
                                            <option value="Scheduled">Scheduled</option>
                                            <option value="Check-in Open">Check-in Open</option>
                                            <option value="Check-in Closed">Check-in Closed</option>
                                            <option value="Boarding">Boarding</option>
                                            <option value="Final Call">Final Call</option>
                                            <option value="Departed">Departed</option>
                                            <option value="Arrived">Arrived</option>
                                            <option value="Delayed">Delayed</option>
                                            <option value="Cancelled">Cancelled</option>
                                            <option value="Gate Open">Gate Open</option>
                                            <option value="Baggage Claim">Baggage Claim</option>
                                            <option value="On Time">On Time</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gate</label>
                                    <select value={data.gate_id} onChange={e => setData('gate_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                                        <option value="">- Tidak Ada -</option>
                                        {gates.map((a: any) => <option key={a.id} value={a.id}>{a.nama_gate}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Baggage Claim</label>
                                    <select value={data.baggage_claim_id} onChange={e => setData('baggage_claim_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                                        <option value="">- Tidak Ada -</option>
                                        {baggageClaims.map((a: any) => <option key={a.id} value={a.id}>Belt {a.nomor_belt}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
