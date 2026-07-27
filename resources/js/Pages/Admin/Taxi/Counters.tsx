import { router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import TaxiShell, { TaxiStat } from './Partials/TaxiShell';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Field } from './Directions';
import CounterArrow from '@/Components/Taxi/CounterArrow';
import { appConfirm } from '@/lib/confirm';
import { Car, ChevronDown, ChevronUp, Edit2, Eye, EyeOff, Plus, Trash2, X } from 'lucide-react';

interface Counter {
    id: number;
    nomor: string;
    nama_operator: string;
    jenis_layanan: string | null;
    arah: string;
    is_active: boolean;
    order_index: number;
}

interface Props {
    counters: Counter[];
    arrows: string[];
}

const EMPTY = {
    nomor: '',
    nama_operator: '',
    jenis_layanan: 'Taksi Reguler',
    arah: '→',
    is_active: true,
    order_index: '' as number | string,
};

export default function Counters({ counters, arrows }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Counter | null>(null);
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({ ...EMPTY });

    const openModal = (c?: Counter) => {
        clearErrors();
        if (c) {
            setEditing(c);
            setData({
                nomor: c.nomor,
                nama_operator: c.nama_operator,
                jenis_layanan: c.jenis_layanan ?? '',
                arah: c.arah,
                is_active: c.is_active,
                order_index: c.order_index,
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
            put(route('admin.taxi.counters.update', editing.id), { preserveScroll: true, onSuccess: close });
        } else {
            post(route('admin.taxi.counters.store'), { preserveScroll: true, onSuccess: close });
        }
    };

    const remove = async (c: Counter) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Counter',
            message: `Hapus counter ${c.nomor} — ${c.nama_operator}?`,
            confirmText: 'Hapus', cancelText: 'Batal',
        });
        if (!ok) return;
        router.delete(route('admin.taxi.counters.destroy', c.id), { preserveScroll: true });
    };

    /** Kirim ulang seluruh kolom karena validasi controller mewajibkannya. */
    const patch = (c: Counter, changes: Partial<Counter>) => {
        router.put(route('admin.taxi.counters.update', c.id), {
            nomor: c.nomor,
            nama_operator: c.nama_operator,
            jenis_layanan: c.jenis_layanan ?? '',
            arah: c.arah,
            is_active: c.is_active,
            order_index: c.order_index,
            ...changes,
        }, { preserveScroll: true });
    };

    const aktif = counters.filter((c) => c.is_active).length;

    return (
        <TaxiShell
            title="Counter Taksi"
            subtitle="Kartu counter yang tampil pada panel petunjuk arah layar signage — bergaya sama dengan papan Boarding Gate. Nomor, operator, dan arah panah sepenuhnya diatur di sini."
            action={
                <button type="button" onClick={() => openModal()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition">
                    <Plus size={18} /> Tambah Counter
                </button>
            }
            stats={
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <TaxiStat label="Total Counter" value={counters.length} icon={<Car size={13} />} />
                    <TaxiStat label="Tayang di Layar" value={aktif} icon={<Eye size={13} />} />
                    <TaxiStat label="Disembunyikan" value={counters.length - aktif} icon={<EyeOff size={13} />} />
                </div>
            }
        >
            {counters.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                    <Car size={28} className="mx-auto text-amber-500" />
                    <h5 className="mt-3 font-bold text-gray-700 dark:text-gray-200">Belum ada counter taksi</h5>
                    <p className="text-sm text-gray-500 mt-1">Tambahkan counter agar panel petunjuk arah di layar terisi.</p>
                    <button type="button" onClick={() => openModal()}
                            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-900 text-sm font-bold hover:bg-amber-600 transition">
                        <Plus size={16} /> Tambah Counter
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {counters.map((c) => (
                        <div key={c.id}
                             className={`rounded-2xl overflow-hidden border shadow-sm transition ${
                                 c.is_active
                                     ? 'border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-800'
                                     : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 opacity-70'
                             }`}>
                            {/* Pratinjau kartu seperti yang tampil di layar */}
                            <div className="flex items-stretch bg-slate-900 text-white">
                                <div className="w-2/5 grid place-items-center py-4 bg-black/60">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Counter</span>
                                    <span className="flex items-center gap-1.5">
                                        <CounterArrow arah={c.arah} className="h-6 w-6 text-amber-400" />
                                        <span className="text-4xl font-black leading-none text-amber-400">{c.nomor}</span>
                                    </span>
                                </div>
                                <div className="flex-1 flex items-center px-3 py-4 min-w-0">
                                    <span className="min-w-0">
                                        <span className="block text-lg font-black truncate">{c.nama_operator}</span>
                                        {c.jenis_layanan && (
                                            <span className="block text-xs text-white/50 truncate">{c.jenis_layanan}</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Ikon semua agar barisnya tetap muat di kartu sempit
                                (label teks sebelumnya terpotong di kolom ke-4). */}
                            <div className="p-2.5 flex items-center gap-0.5">
                                <span className="px-1 text-[10px] font-black uppercase tracking-widest text-gray-400 tabular-nums">
                                    #{c.order_index}
                                </span>
                                <button onClick={() => patch(c, { order_index: Math.max(0, c.order_index - 1) })}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700" title="Naikkan urutan">
                                    <ChevronUp size={14} />
                                </button>
                                <button onClick={() => patch(c, { order_index: c.order_index + 1 })}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700" title="Turunkan urutan">
                                    <ChevronDown size={14} />
                                </button>
                                <button onClick={() => patch(c, { is_active: !c.is_active })}
                                        title={c.is_active ? 'Sembunyikan dari layar' : 'Tayangkan di layar'}
                                        className={`p-1.5 rounded-lg ${
                                            c.is_active
                                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                        }`}>
                                    {c.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <span className="flex-1" />
                                <button onClick={() => openModal(c)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30" title="Edit">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => remove(c)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Hapus">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Ubin tambah — selalu berada tepat setelah kartu terakhir,
                        jadi operator tidak perlu menggulir kembali ke tombol di hero. */}
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="min-h-[9rem] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition flex flex-col items-center justify-center gap-2"
                    >
                        <span className="grid place-items-center h-11 w-11 rounded-full bg-gray-100 dark:bg-gray-700">
                            <Plus size={22} />
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest">Tambah Counter</span>
                    </button>
                </div>
            )}

            <Modal show={open} onClose={close} maxWidth="lg">
                <form onSubmit={submit} className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {editing ? 'Edit Counter Taksi' : 'Tambah Counter Taksi'}
                        </h2>
                        <button type="button" onClick={close} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Nomor counter" error={errors.nomor}>
                            <TextInput className="mt-1 block w-full" value={data.nomor} required maxLength={10}
                                       onChange={(e) => setData('nomor', e.target.value)} placeholder="01" />
                        </Field>
                        <Field label="Urutan tampil" error={errors.order_index}>
                            <TextInput type="number" min={0} className="mt-1 block w-full" value={data.order_index}
                                       onChange={(e) => setData('order_index', e.target.value)} />
                        </Field>

                        <Field label="Nama operator / armada" error={errors.nama_operator}>
                            <TextInput className="mt-1 block w-full" value={data.nama_operator} required
                                       onChange={(e) => setData('nama_operator', e.target.value)} placeholder="Bluebird Group" />
                        </Field>
                        <Field label="Jenis layanan" error={errors.jenis_layanan}>
                            <TextInput className="mt-1 block w-full" value={data.jenis_layanan}
                                       onChange={(e) => setData('jenis_layanan', e.target.value)} placeholder="Taksi Reguler" />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Arah panah pada kartu" error={errors.arah}>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {arrows.map((a) => (
                                        <button key={a} type="button" onClick={() => setData('arah', a)}
                                                className={`h-11 w-11 grid place-items-center rounded-xl border-2 transition ${
                                                    data.arah === a
                                                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-400'
                                                }`}>
                                            <CounterArrow arah={a} className="h-5 w-5" />
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        </div>

                        <Field label="Status" error={errors.is_active}>
                            <label className="mt-2 inline-flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={data.is_active}
                                       onChange={(e) => setData('is_active', e.target.checked)}
                                       className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Tayangkan di layar</span>
                            </label>
                        </Field>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <SecondaryButton type="button" onClick={close}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>{editing ? 'Simpan' : 'Tambah'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </TaxiShell>
    );
}
