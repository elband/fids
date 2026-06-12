import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Edit, Trash, Plus, MapPin, Search, CheckCircle2, Globe } from 'lucide-react';
import MasterHero from '@/Components/MasterHero';
import { appConfirm } from '@/lib/confirm';

interface Airport {
    id: number;
    kode_iata: string;
    nama_bandara: string;
    kota: string;
    negara: string;
    status_aktif: boolean;
}

interface Props {
    airports: Airport[];
}

export default function Index({ airports }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        kode_iata: '',
        nama_bandara: '',
        kota: '',
        negara: 'Indonesia',
        status_aktif: true,
    });

    const openModal = (airport: Airport | null = null) => {
        if (airport) {
            setEditingId(airport.id);
            setData({
                kode_iata: airport.kode_iata,
                nama_bandara: airport.nama_bandara,
                kota: airport.kota,
                negara: airport.negara,
                status_aktif: airport.status_aktif,
            });
        } else {
            setEditingId(null);
            reset();
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
            put(route('admin.airports.update', editingId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.airports.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const deleteAirport = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Bandara',
            message: 'Apakah Anda yakin ingin menghapus bandara ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route('admin.airports.destroy', id));
    };

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const filtered = useMemo(() => {
        return airports.filter((a) => {
            if (statusFilter === 'active' && !a.status_aktif) return false;
            if (statusFilter === 'inactive' && a.status_aktif) return false;
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                a.nama_bandara?.toLowerCase().includes(q) ||
                a.kode_iata?.toLowerCase().includes(q) ||
                a.kota?.toLowerCase().includes(q) ||
                a.negara?.toLowerCase().includes(q)
            );
        });
    }, [airports, query, statusFilter]);

    const stats = useMemo(() => {
        const countries = new Set(airports.map((a) => a.negara)).size;
        return {
            total: airports.length,
            active: airports.filter((a) => a.status_aktif).length,
            countries,
            cities: new Set(airports.map((a) => a.kota)).size,
        };
    }, [airports]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Master Data Bandara
                </h2>
            }
        >
            <Head title="Master Bandara" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <MasterHero
                        gradient="from-cyan-600 via-teal-600 to-emerald-700"
                        eyebrow="Data Master"
                        icon={<MapPin size={12} />}
                        title="Data Bandara"
                        description="Kode IATA, kota, dan negara untuk semua bandara yang dipakai dalam jadwal penerbangan."
                        actions={
                            <button
                                onClick={() => openModal()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-cyan-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                            >
                                <Plus size={16} /> Tambah Bandara
                            </button>
                        }
                        stats={[
                            { label: 'Total', value: stats.total, icon: <MapPin size={14} /> },
                            { label: 'Aktif', value: stats.active, icon: <CheckCircle2 size={14} /> },
                            { label: 'Kota', value: stats.cities, icon: <MapPin size={14} /> },
                            { label: 'Negara', value: stats.countries, icon: <Globe size={14} /> },
                        ]}
                    />

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari kode IATA, nama, atau kota..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-fuchsia-500 focus:ring focus:ring-fuchsia-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700">
                            {(['all', 'active', 'inactive'] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                                        statusFilter === f
                                            ? 'bg-white dark:bg-gray-700 text-fuchsia-700 dark:text-fuchsia-200 shadow'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Off'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center mx-auto mb-4">
                                <MapPin size={28} className="text-cyan-500" />
                            </div>
                            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                {airports.length === 0 ? 'Belum ada bandara' : 'Tidak ada hasil'}
                            </h5>
                            <p className="text-sm text-gray-500 mt-1">Tambahkan data bandara untuk dipakai di rute penerbangan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((airport) => (
                                <div key={airport.id} className="group relative rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-cyan-300 dark:hover:ring-cyan-500 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden">
                                    <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-teal-500" />
                                    <div className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center shadow shrink-0">
                                                <span className="font-black text-lg tracking-widest">{airport.kode_iata}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h5 className="text-sm font-bold text-gray-900 dark:text-white leading-snug truncate">{airport.nama_bandara}</h5>
                                                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                                                    <MapPin size={11} className="shrink-0" />
                                                    <span className="truncate">{airport.kota}, {airport.negara}</span>
                                                </div>
                                                {airport.status_aktif ? (
                                                    <span className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[9px] font-black uppercase tracking-widest">
                                                        <CheckCircle2 size={9} /> Aktif
                                                    </span>
                                                ) : (
                                                    <span className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-widest">
                                                        Off
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
                                            <button onClick={() => openModal(airport)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-cyan-50 text-cyan-700 hover:bg-cyan-600 hover:text-white transition border border-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-200 dark:border-cyan-700/40">
                                                <Edit size={12} /> Edit
                                            </button>
                                            <button onClick={() => deleteAirport(airport.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition">
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {editingId ? 'Edit Bandara' : 'Tambah Bandara Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Kode IATA</label>
                                    <input 
                                        type="text" 
                                        maxLength={3} 
                                        placeholder="BPN"
                                        value={data.kode_iata} 
                                        onChange={e => setData('kode_iata', e.target.value.toUpperCase())} 
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 uppercase font-bold text-center" 
                                        required 
                                    />
                                    {errors.kode_iata && <p className="text-red-500 text-[10px] mt-1">{errors.kode_iata}</p>}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Nama Bandara</label>
                                    <input 
                                        type="text" 
                                        placeholder="Sultan Aji Muhammad Sulaiman Sepinggan"
                                        value={data.nama_bandara} 
                                        onChange={e => setData('nama_bandara', e.target.value)} 
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                        required 
                                    />
                                    {errors.nama_bandara && <p className="text-red-500 text-[10px] mt-1">{errors.nama_bandara}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Kota</label>
                                    <input 
                                        type="text" 
                                        placeholder="Balikpapan"
                                        value={data.kota} 
                                        onChange={e => setData('kota', e.target.value)} 
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                        required 
                                    />
                                    {errors.kota && <p className="text-red-500 text-[10px] mt-1">{errors.kota}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Negara</label>
                                    <input 
                                        type="text" 
                                        placeholder="Indonesia"
                                        value={data.negara} 
                                        onChange={e => setData('negara', e.target.value)} 
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                                        required 
                                    />
                                    {errors.negara && <p className="text-red-500 text-[10px] mt-1">{errors.negara}</p>}
                                </div>
                            </div>

                            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={data.status_aktif}
                                        onChange={e => setData('status_aktif', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
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
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Bandara'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
