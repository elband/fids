import { router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import TaxiShell, { TaxiStat } from './Partials/TaxiShell';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Field } from './Directions';
import { appConfirm } from '@/lib/confirm';
import { CalendarClock, Edit2, Plus, Search, Sparkles, Trash2, Wallet, X } from 'lucide-react';

interface Fare {
    id: number;
    wilayah: string;
    tujuan: string;
    jenis_kendaraan: string;
    tarif: number;
    tarif_sebelumnya: number | null;
    berlaku_mulai: string | null;
    berlaku_sampai: string | null;
    is_active: boolean;
    order_index: number;
    baru: boolean;
}

interface Props {
    fares: Fare[];
    wilayahList: string[];
}

const EMPTY = {
    wilayah: '',
    tujuan: '',
    jenis_kendaraan: 'Taksi Reguler',
    tarif: '' as number | string,
    berlaku_mulai: '',
    berlaku_sampai: '',
    is_active: true,
    order_index: '' as number | string,
};

const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export default function Fares({ fares, wilayahList }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Fare | null>(null);
    const [query, setQuery] = useState('');
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({ ...EMPTY });

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return fares;
        return fares.filter((f) =>
            f.tujuan.toLowerCase().includes(q) || f.wilayah.toLowerCase().includes(q));
    }, [fares, query]);

    // Kelompokkan per wilayah — sama seperti urutan tampilnya di layar.
    const grouped = useMemo(() => {
        const map = new Map<string, Fare[]>();
        filtered.forEach((f) => map.set(f.wilayah, [...(map.get(f.wilayah) ?? []), f]));
        return [...map.entries()];
    }, [filtered]);

    const openModal = (f?: Fare) => {
        clearErrors();
        if (f) {
            setEditing(f);
            setData({
                wilayah: f.wilayah,
                tujuan: f.tujuan,
                jenis_kendaraan: f.jenis_kendaraan,
                tarif: f.tarif,
                berlaku_mulai: f.berlaku_mulai ?? '',
                berlaku_sampai: f.berlaku_sampai ?? '',
                is_active: f.is_active,
                order_index: f.order_index,
            });
        } else {
            setEditing(null);
            reset();
        }
        setOpen(true);
    };

    const close = () => { setOpen(false); setEditing(null); reset(); };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.taxi.fares.update', editing.id), { preserveScroll: true, onSuccess: close });
        } else {
            post(route('admin.taxi.fares.store'), { preserveScroll: true, onSuccess: close });
        }
    };

    const remove = async (f: Fare) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Tarif',
            message: `Hapus tarif tujuan "${f.tujuan}"?`,
            confirmText: 'Hapus', cancelText: 'Batal',
        });
        if (!ok) return;
        router.delete(route('admin.taxi.fares.destroy', f.id), { preserveScroll: true });
    };

    const aktif = fares.filter((f) => f.is_active).length;
    const baru = fares.filter((f) => f.baru).length;
    const terjadwal = fares.filter((f) => f.berlaku_mulai || f.berlaku_sampai).length;

    return (
        <TaxiShell
            title="Tarif Taksi"
            subtitle="Daftar tarif resmi yang tampil di layar. Perubahan nominal otomatis disorot sebagai tarif baru selama 7 hari, dan tarif bisa dijadwalkan berlaku mulai tanggal tertentu."
            action={
                <button type="button" onClick={() => openModal()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition">
                    <Plus size={18} /> Tambah Tarif
                </button>
            }
            stats={
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <TaxiStat label="Total Tarif" value={fares.length} icon={<Wallet size={13} />} />
                    <TaxiStat label="Aktif" value={aktif} icon={<Wallet size={13} />} />
                    <TaxiStat label="Baru Berubah" value={baru} icon={<Sparkles size={13} />} />
                    <TaxiStat label="Terjadwal" value={terjadwal} icon={<CalendarClock size={13} />} />
                </div>
            }
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari tujuan atau wilayah..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:border-amber-500 focus:ring focus:ring-amber-500/20"
                    />
                </div>
            </div>

            {grouped.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                    <Wallet size={28} className="mx-auto text-amber-500" />
                    <h5 className="mt-3 font-bold text-gray-700 dark:text-gray-200">
                        {fares.length === 0 ? 'Belum ada tarif' : 'Tidak ada tarif yang cocok'}
                    </h5>
                </div>
            ) : (
                <div className="space-y-5">
                    {grouped.map(([wilayah, items]) => (
                        <div key={wilayah} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                                    {wilayah} <span className="ml-2 text-gray-400">({items.length})</span>
                                </h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                            <th className="px-5 py-2 font-black">Tujuan</th>
                                            <th className="px-5 py-2 font-black">Kendaraan</th>
                                            <th className="px-5 py-2 font-black text-right">Tarif</th>
                                            <th className="px-5 py-2 font-black">Masa Berlaku</th>
                                            <th className="px-5 py-2 font-black">Status</th>
                                            <th className="px-5 py-2" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                        {items.map((f) => (
                                            <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="px-5 py-3">
                                                    <span className="font-bold text-gray-900 dark:text-white">{f.tujuan}</span>
                                                    {f.baru && (
                                                        <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500 text-slate-900 text-[9px] font-black tracking-widest">
                                                            BARU
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-gray-500">{f.jenis_kendaraan}</td>
                                                <td className="px-5 py-3 text-right">
                                                    {f.tarif_sebelumnya !== null && f.tarif_sebelumnya !== f.tarif && (
                                                        <span className="block text-[11px] text-gray-400 line-through tabular-nums">
                                                            {rupiah(f.tarif_sebelumnya)}
                                                        </span>
                                                    )}
                                                    <span className="font-black text-gray-900 dark:text-white tabular-nums">
                                                        {rupiah(f.tarif)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-xs text-gray-500">
                                                    {f.berlaku_mulai || f.berlaku_sampai
                                                        ? `${f.berlaku_mulai ?? '…'} → ${f.berlaku_sampai ?? '…'}`
                                                        : 'Tanpa batas'}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        f.is_active
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                    }`}>
                                                        {f.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openModal(f)}
                                                                className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition" title="Edit">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => remove(f)}
                                                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition" title="Hapus">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal show={open} onClose={close} maxWidth="lg">
                <form onSubmit={submit} className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {editing ? 'Edit Tarif' : 'Tambah Tarif'}
                        </h2>
                        <button type="button" onClick={close} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Wilayah" error={errors.wilayah}>
                            <TextInput className="mt-1 block w-full" value={data.wilayah} required list="wilayah-list"
                                       onChange={(e) => setData('wilayah', e.target.value)} placeholder="Samarinda" />
                            <datalist id="wilayah-list">
                                {wilayahList.map((w) => <option key={w} value={w} />)}
                            </datalist>
                        </Field>
                        <Field label="Tujuan" error={errors.tujuan}>
                            <TextInput className="mt-1 block w-full" value={data.tujuan} required
                                       onChange={(e) => setData('tujuan', e.target.value)} placeholder="Samarinda Kota" />
                        </Field>
                        <Field label="Jenis kendaraan" error={errors.jenis_kendaraan}>
                            <TextInput className="mt-1 block w-full" value={data.jenis_kendaraan} required
                                       onChange={(e) => setData('jenis_kendaraan', e.target.value)} />
                        </Field>
                        <Field label="Tarif (Rp)" error={errors.tarif}>
                            <TextInput type="number" min={0} step={1000} className="mt-1 block w-full" value={data.tarif} required
                                       onChange={(e) => setData('tarif', e.target.value)} placeholder="150000" />
                        </Field>
                        <Field label="Berlaku mulai" error={errors.berlaku_mulai}>
                            <TextInput type="date" className="mt-1 block w-full" value={data.berlaku_mulai}
                                       onChange={(e) => setData('berlaku_mulai', e.target.value)} />
                        </Field>
                        <Field label="Berlaku sampai" error={errors.berlaku_sampai}>
                            <TextInput type="date" className="mt-1 block w-full" value={data.berlaku_sampai}
                                       onChange={(e) => setData('berlaku_sampai', e.target.value)} />
                        </Field>
                        <Field label="Urutan" error={errors.order_index}>
                            <TextInput type="number" min={0} className="mt-1 block w-full" value={data.order_index}
                                       onChange={(e) => setData('order_index', e.target.value)} />
                        </Field>
                        <Field label="Status" error={errors.is_active}>
                            <label className="mt-2 inline-flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={data.is_active}
                                       onChange={(e) => setData('is_active', e.target.checked)}
                                       className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Tampilkan di layar</span>
                            </label>
                        </Field>
                    </div>

                    <p className="text-xs text-gray-400">
                        Tarif lama tersimpan otomatis saat nominal diubah, sehingga layar dapat menyorot perubahan.
                    </p>

                    <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <SecondaryButton type="button" onClick={close}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>{editing ? 'Simpan' : 'Tambah'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </TaxiShell>
    );
}
