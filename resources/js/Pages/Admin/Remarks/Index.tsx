import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Edit, Trash, Plus, Search, Hash, AlertCircle, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import MasterHero from '@/Components/MasterHero';
import { appConfirm } from '@/lib/confirm';

export default function Index({ remarks }: { remarks: any[] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        kode: '',
        nama_remark: '',
        status_aktif: true,
    });

    const openModal = (remark: any = null) => {
        if (remark) {
            setEditingId(remark.id);
            setData({
                kode: remark.kode,
                nama_remark: remark.nama_remark,
                status_aktif: remark.status_aktif,
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
            put(route('admin.remarks.update', editingId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.remarks.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const deleteRemark = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Remark',
            message: 'Apakah Anda yakin ingin menghapus remark ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route('admin.remarks.destroy', id));
    };

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const filtered = useMemo(() => {
        return remarks.filter((r) => {
            if (statusFilter === 'active' && !r.status_aktif) return false;
            if (statusFilter === 'inactive' && r.status_aktif) return false;
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                r.kode?.toLowerCase().includes(q) ||
                r.nama_remark?.toLowerCase().includes(q)
            );
        });
    }, [remarks, query, statusFilter]);

    const stats = useMemo(() => ({
        total: remarks.length,
        active: remarks.filter((r) => r.status_aktif).length,
        inactive: remarks.filter((r) => !r.status_aktif).length,
    }), [remarks]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Manajemen Remark
                </h2>
            }
        >
            <Head title="Remark" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <MasterHero
                        gradient="from-amber-600 via-orange-600 to-rose-600"
                        eyebrow="Data Master"
                        icon={<Hash size={12} />}
                        title="Remark Penerbangan"
                        description="Daftar kode remark/keterangan singkat untuk status penerbangan."
                        actions={
                            <button
                                onClick={() => openModal()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-amber-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                            >
                                <Plus size={16} /> Tambah Remark
                            </button>
                        }
                        stats={[
                            { label: 'Total', value: stats.total, icon: <Hash size={14} /> },
                            { label: 'Aktif', value: stats.active, icon: <CheckCircle2 size={14} /> },
                            { label: 'Nonaktif', value: stats.inactive, icon: <XCircle size={14} /> },
                            { label: 'Tersedia', value: stats.active, icon: <MessageSquare size={14} /> },
                        ]}
                    />

                    {/* Toolbar */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari kode atau deskripsi remark..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-amber-500 focus:ring focus:ring-amber-500/20"
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
                                            ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-200 shadow'
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
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                                <MessageSquare size={28} className="text-amber-500" />
                            </div>
                            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                {remarks.length === 0 ? 'Belum ada remark' : 'Tidak ada hasil'}
                            </h5>
                            <p className="text-sm text-gray-500 mt-1">Klik "Tambah Remark" untuk menambahkan kode keterangan baru.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((remark) => (
                                <div
                                    key={remark.id}
                                    className="group relative rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-amber-300 dark:hover:ring-amber-500 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
                                >
                                    <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
                                    <div className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow shrink-0 ring-2 ring-amber-100 dark:ring-amber-900/40">
                                                <span className="font-black text-lg tracking-wide">{remark.kode}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                                        Remark
                                                    </span>
                                                    {remark.status_aktif ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                                                            <CheckCircle2 size={10} /> Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                            <XCircle size={10} /> Off
                                                        </span>
                                                    )}
                                                </div>
                                                <h5 className="mt-1 text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2" title={remark.nama_remark}>
                                                    {remark.nama_remark}
                                                </h5>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => openModal(remark)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition border border-amber-100 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/40"
                                            >
                                                <Edit size={12} /> Edit
                                            </button>
                                            <button
                                                onClick={() => deleteRemark(remark.id)}
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
                            {editingId ? 'Edit Remark' : 'Tambah Remark'}
                        </h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kode Remark</label>
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Remark</label>
                                <input
                                    type="text"
                                    value={data.nama_remark}
                                    onChange={(e) => setData('nama_remark', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                    required
                                />
                                {errors.nama_remark && <p className="text-red-500 text-xs mt-1">{errors.nama_remark}</p>}
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
