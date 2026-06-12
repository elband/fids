import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Edit, Trash, Plus, Users, Search, ShieldCheck } from 'lucide-react';
import MasterHero from '@/Components/MasterHero';
import { appConfirm } from '@/lib/confirm';

type User = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    created_at: string;
};

type Props = {
    users: User[];
    roles: string[];
    currentUserId: number;
};

const ROLE_COLORS: Record<string, string> = {
    'Super Admin':       'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'Admin Operasional': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Operator FIDS':     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Viewer':            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function Index({ users, roles, currentUserId }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        role: roles[0] ?? '',
    });

    const openCreate = () => {
        setEditingId(null);
        reset();
        setData('role', roles[0] ?? '');
        setShowModal(true);
    };

    const openEdit = (user: User) => {
        setEditingId(user.id);
        setData({
            name:     user.name,
            email:    user.email,
            password: '',
            role:     user.role ?? roles[0] ?? '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
        setEditingId(null);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(route('admin.users.update', editingId), { onSuccess: closeModal });
        } else {
            post(route('admin.users.store'), { onSuccess: closeModal });
        }
    };

    const deleteUser = async (user: User) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus User',
            message: `Hapus akun "${user.name}"? Tindakan ini tidak dapat dibatalkan.`,
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route('admin.users.destroy', user.id));
    };

    const filtered = useMemo(() => {
        return users.filter((u) => {
            if (roleFilter !== 'all' && u.role !== roleFilter) return false;
            if (!query) return true;
            const q = query.toLowerCase();
            return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        });
    }, [users, query, roleFilter]);

    const stats = useMemo(() => {
        const counts: Record<string, number> = {};
        users.forEach((u) => { if (u.role) counts[u.role] = (counts[u.role] ?? 0) + 1; });
        return counts;
    }, [users]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Manajemen User
                </h2>
            }
        >
            <Head title="Manajemen User" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <MasterHero
                        gradient="from-violet-600 via-purple-600 to-indigo-700"
                        eyebrow="Sistem"
                        icon={<Users size={12} />}
                        title="Manajemen User"
                        description="Kelola akun pengguna dan hak akses sistem FIDS berdasarkan role masing-masing."
                        actions={
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-violet-700 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition active:translate-y-0 ring-1 ring-white/30"
                            >
                                <Plus size={16} /> Tambah User
                            </button>
                        }
                        stats={[
                            { label: 'Total User', value: users.length, icon: <Users size={14} /> },
                            ...roles.map((r) => ({
                                label: r,
                                value: stats[r] ?? 0,
                                icon: <ShieldCheck size={14} />,
                            })),
                        ]}
                    />

                    {/* Toolbar */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama atau email..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-violet-500 focus:ring focus:ring-violet-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setRoleFilter('all')}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                    roleFilter === 'all'
                                        ? 'bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-200 shadow'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                Semua
                            </button>
                            {roles.map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRoleFilter(r)}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                                        roleFilter === r
                                            ? 'bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-200 shadow'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        {filtered.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                                    <Users size={28} className="text-violet-500" />
                                </div>
                                <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">
                                    {users.length === 0 ? 'Belum ada user' : 'Tidak ada hasil'}
                                </h5>
                                <p className="text-sm text-gray-500 mt-1">Klik "Tambah User" untuk membuat akun baru.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-[11px] tracking-wider">Nama</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-[11px] tracking-wider">Email</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-[11px] tracking-wider">Role</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-[11px] tracking-wider">Dibuat</th>
                                        <th className="text-right px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-[11px] tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filtered.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold text-sm shrink-0">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {user.name}
                                                            {user.id === currentUserId && (
                                                                <span className="ml-2 text-[10px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded-full">Anda</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">{user.email}</td>
                                            <td className="px-6 py-4">
                                                {user.role ? (
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        <ShieldCheck size={10} />
                                                        {user.role}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">{user.created_at}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEdit(user)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white transition border border-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-700/40"
                                                    >
                                                        <Edit size={12} /> Edit
                                                    </button>
                                                    {user.id !== currentUserId && (
                                                        <button
                                                            onClick={() => deleteUser(user)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                                            title="Hapus"
                                                        >
                                                            <Trash size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
                        <h3 className="text-lg font-bold mb-5 text-gray-900 dark:text-gray-100">
                            {editingId ? 'Edit User' : 'Tambah User Baru'}
                        </h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-violet-500 focus:ring focus:ring-violet-500/20"
                                    placeholder="Masukkan nama lengkap"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-violet-500 focus:ring focus:ring-violet-500/20"
                                    placeholder="user@example.com"
                                    required
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password {editingId && <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>}
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-violet-500 focus:ring focus:ring-violet-500/20"
                                    placeholder={editingId ? 'Biarkan kosong jika tidak diubah' : 'Min. 8 karakter'}
                                    required={!editingId}
                                    minLength={editingId ? undefined : 8}
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <select
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-violet-500 focus:ring focus:ring-violet-500/20"
                                    required
                                >
                                    {roles.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm font-bold"
                                >
                                    {processing ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
