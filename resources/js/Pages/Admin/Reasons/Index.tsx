import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Edit, Trash, Plus, Search, Hash, AlertCircle, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import MasterHero from '@/Components/MasterHero';
import { appConfirm } from '@/lib/confirm';

export default function Index({ reasons }: { reasons: any[] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        kode: '',
        deskripsi: '',
        kategori: '',
        status_aktif: true,
    });

    const openModal = (reason: any = null) => {
        if (reason) {
            setEditingId(reason.id);
            setData({
                kode: reason.kode,
                deskripsi: reason.deskripsi,
                kategori: reason.kategori || '',
                status_aktif: reason.status_aktif,
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
            put(route('admin.reasons.update', editingId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.reasons.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const deleteReason = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Reason',
            message: 'Apakah Anda yakin ingin menghapus reason ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route('admin.reasons.destroy', id));
    };

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const filtered = useMemo(() => {
        return reasons.filter((r) => {
            if (statusFilter === 'active' && !r.status_aktif) return false;
            if (statusFilter === 'inactive' && r.status_aktif) return false;
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                r.kode?.toLowerCase().includes(q) ||
                r.deskripsi?.toLowerCase().includes(q) ||
                r.kategori?.toLowerCase().includes(q)
            );
        });
    }, [reasons, query, statusFilter]);

    const stats = useMemo(() => {
        const categories = new Set(reasons.map((r) => r.kategori).filter(Boolean)).size;
        return {
            total: reasons.length,
            active: reasons.filter((r) => r.status_aktif).length,
            inactive: reasons.filter((r) => !r.status_aktif).length,
            categories,
        };
    }, [reasons]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Manajemen Reason
                </h2>
            }
        >
            <Head title="Reason" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <MasterHero
                        gradient="from-rose-600 via-red-600 to-orange-600"
                        eyebrow="Data Master"
                        icon={<AlertCircle size={12} />}
                        title="Reason Code"
                        description="Daftar alasan baku untuk delay, cancel, dan diversi penerbangan."
                        actions={
                            <button
                                onClick={() => openModal()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-rose-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                            >
                                <Plus size={16} /> Tambah Reason
                            </button>
                        }
                        stats={[
                            { label: 'Total', value: stats.total, icon: <AlertCircle size={14} /> },
                            { label: 'Aktif', value: stats.active, icon: <CheckCircle2 size={14} /> },
                            { label: 'Nonaktif', value: stats.inactive, icon: <XCircle size={14} /> },
                            { label: 'Kategori', value: stats.categories, icon: <Hash size={14} /> },
                        ]}
                    />

                    {/* Toolbar */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari kode, deskripsi, atau kategori reason..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-rose-500 focus:ring focus:ring-rose-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700">
                            {(['all', 'active', 'inactive'] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                        statusFilter === f
                                            ? 'bg-white dark:bg-gray-700 text-rose-700 dark:text-rose-200 shadow'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Nonaktif'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cards Grid */}
                    {filtered.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={28} className="text-rose-500" />
                            </div>
                            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                {reasons.length === 0 ? 'Belum ada reason' : 'Tidak ada hasil'}
                            </h5>
                            <p className="text-sm text-gray-500 mt-1">Klik "Tambah Reason" untuk menambahkan alasan delay/cancel.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((reason) => (
                                <div
                                    key={reason.id}
                                    className="group relative rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-rose-300 dark:hover:ring-rose-500 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
                                >
                                    <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-500" />
                                    <div className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow shrink-0 ring-2 ring-rose-100 dark:ring-rose-900/40">
                                                <span className="font-black text-lg tracking-wide">{reason.kode}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {reason.kategori ? (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                                                            {reason.kategori}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                            Reason
                                                        </span>
                                                    )}
                                                    {reason.status_aktif ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                                                            <CheckCircle2 size={10} /> Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                            <XCircle size={10} /> Off
                                                        </span>
                                                    )}
                                                </div>
                                                <h5 className="mt-1 text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2" title={reason.deskripsi}>
                                                    {reason.deskripsi}
                                                </h5>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => openModal(reason)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition border border-rose-100 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/40"
                                            >
                                                <Edit size={12} /> Edit
                                            </button>
                                            <button
                                                onClick={() => deleteReason(reason.id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                                title="Hapus"
                                            >
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                            {editingId ? 'Edit Reason' : 'Tambah Reason'}
                        </h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kode Reason</label>
                                <input
                                    type="text"
                                    value={data.kode}
                                    onChange={(e) => setData('kode', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                    required
                                />
                                {errors.kode && <p className="text-red-500 text-xs mt-1">{errors.kode}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi</label>
                                <input
                                    type="text"
                                    value={data.deskripsi}
                                    onChange={(e) => setData('deskripsi', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                    required
                                />
                                {errors.deskripsi && <p className="text-red-500 text-xs mt-1">{errors.deskripsi}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori (Opsional)</label>
                                <input
                                    type="text"
                                    value={data.kategori}
                                    onChange={(e) => setData('kategori', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                />
                                {errors.kategori && <p className="text-red-500 text-xs mt-1">{errors.kategori}</p>}
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
