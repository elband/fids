import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Edit, Trash, Plus, Plane, Search, CheckCircle2, XCircle, Users } from 'lucide-react';
import MasterHero from '@/Components/MasterHero';
import { appConfirm } from '@/lib/confirm';

export default function Index({ airplanes, airlines }: { airplanes: any[], airlines: any[] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        airline_id: '',
        nomor_registrasi: '',
        tipe_pesawat: '',
        kapasitas: '',
        status_aktif: true,
    });

    const openModal = (airplane: any = null) => {
        if (airplane) {
            setEditingId(airplane.id);
            setData({
                airline_id: airplane.airline_id,
                nomor_registrasi: airplane.nomor_registrasi,
                tipe_pesawat: airplane.tipe_pesawat,
                kapasitas: airplane.kapasitas || '',
                status_aktif: airplane.status_aktif,
            });
        } else {
            setEditingId(null);
            reset();
            if (airlines.length > 0) setData('airline_id', airlines[0].id);
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
            put(route('admin.airplanes.update', editingId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.airplanes.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const deleteAirplane = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Pesawat',
            message: 'Apakah Anda yakin ingin menghapus pesawat ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route('admin.airplanes.destroy', id));
    };

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [airlineFilter, setAirlineFilter] = useState<string>('all');

    const filtered = useMemo(() => {
        return airplanes.filter((p) => {
            if (statusFilter === 'active' && !p.status_aktif) return false;
            if (statusFilter === 'inactive' && p.status_aktif) return false;
            if (airlineFilter !== 'all' && String(p.airline_id) !== airlineFilter) return false;
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                p.nomor_registrasi?.toLowerCase().includes(q) ||
                p.tipe_pesawat?.toLowerCase().includes(q) ||
                p.airline?.nama_maskapai?.toLowerCase().includes(q)
            );
        });
    }, [airplanes, query, statusFilter, airlineFilter]);

    const stats = useMemo(() => ({
        total: airplanes.length,
        active: airplanes.filter((p) => p.status_aktif).length,
        capacity: airplanes.reduce((s, p) => s + (Number(p.kapasitas) || 0), 0),
    }), [airplanes]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Manajemen Pesawat
                </h2>
            }
        >
            <Head title="Pesawat" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <MasterHero
                        gradient="from-indigo-600 via-violet-600 to-purple-700"
                        eyebrow="Data Master"
                        icon={<Plane size={12} />}
                        title="Manajemen Pesawat"
                        description="Daftar armada pesawat termasuk nomor registrasi, tipe, dan kapasitas penumpang."
                        actions={
                            <button
                                onClick={() => openModal()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                            >
                                <Plus size={16} /> Tambah Pesawat
                            </button>
                        }
                        stats={[
                            { label: 'Total', value: stats.total, icon: <Plane size={14} /> },
                            { label: 'Aktif', value: stats.active, icon: <CheckCircle2 size={14} /> },
                            { label: 'Total Kursi', value: stats.capacity || '-', icon: <Users size={14} /> },
                            { label: 'Maskapai', value: airlines.length, icon: <Plane size={14} /> },
                        ]}
                    />

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nomor registrasi, tipe, atau maskapai..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-fuchsia-500 focus:ring focus:ring-fuchsia-500/20"
                            />
                        </div>
                        <select
                            value={airlineFilter}
                            onChange={(e) => setAirlineFilter(e.target.value)}
                            className="rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-xs"
                        >
                            <option value="all">Semua Maskapai</option>
                            {airlines.map((a) => <option key={a.id} value={a.id}>{a.nama_maskapai}</option>)}
                        </select>
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
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                                <Plane size={28} className="text-indigo-500" />
                            </div>
                            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                {airplanes.length === 0 ? 'Belum ada pesawat' : 'Tidak ada hasil'}
                            </h5>
                            <p className="text-sm text-gray-500 mt-1">Tambahkan armada pesawat yang dimiliki maskapai.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((airplane) => {
                                const accent = airplane.airline?.warna_identitas || '#6366f1';
                                return (
                                    <div
                                        key={airplane.id}
                                        className="group relative rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-indigo-300 dark:hover:ring-indigo-500 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
                                    >
                                        <div className="h-1 w-full" style={{ backgroundColor: accent }} />
                                        <div className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white shadow"
                                                    style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}
                                                >
                                                    <Plane size={18} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 truncate">
                                                        {airplane.airline?.nama_maskapai ?? '—'}
                                                    </div>
                                                    <h5 className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">
                                                        {airplane.nomor_registrasi}
                                                    </h5>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">{airplane.tipe_pesawat}</p>
                                                </div>
                                                {airplane.status_aktif ? (
                                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-500">
                                                        Off
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center justify-between text-[11px]">
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <Users size={11} /> {airplane.kapasitas || '—'} kursi
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openModal(airplane)} className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition">
                                                        <Edit size={13} />
                                                    </button>
                                                    <button onClick={() => deleteAirplane(airplane.id)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition">
                                                        <Trash size={13} />
                                                    </button>
                                                </div>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                            {editingId ? 'Edit Pesawat' : 'Tambah Pesawat'}
                        </h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Maskapai</label>
                                <select
                                    value={data.airline_id}
                                    onChange={(e) => setData('airline_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                    required
                                >
                                    <option value="" disabled>Pilih Maskapai</option>
                                    {airlines.map((airline) => (
                                        <option key={airline.id} value={airline.id}>{airline.nama_maskapai}</option>
                                    ))}
                                </select>
                                {errors.airline_id && <p className="text-red-500 text-xs mt-1">{errors.airline_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">No. Registrasi (Tail Number)</label>
                                <input
                                    type="text"
                                    value={data.nomor_registrasi}
                                    onChange={(e) => setData('nomor_registrasi', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                    required
                                />
                                {errors.nomor_registrasi && <p className="text-red-500 text-xs mt-1">{errors.nomor_registrasi}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipe Pesawat</label>
                                <input
                                    type="text"
                                    value={data.tipe_pesawat}
                                    onChange={(e) => setData('tipe_pesawat', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                    required
                                />
                                {errors.tipe_pesawat && <p className="text-red-500 text-xs mt-1">{errors.tipe_pesawat}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kapasitas (Opsional)</label>
                                <input
                                    type="number"
                                    value={data.kapasitas}
                                    onChange={(e) => setData('kapasitas', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                />
                                {errors.kapasitas && <p className="text-red-500 text-xs mt-1">{errors.kapasitas}</p>}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="status_aktif"
                                    checked={data.status_aktif}
                                    onChange={(e) => setData('status_aktif', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <label htmlFor="status_aktif" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    Status Aktif
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
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
