import { router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import TaxiShell, { TaxiStat } from './Partials/TaxiShell';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Field } from './Directions';
import { appConfirm } from '@/lib/confirm';
import { CalendarClock, Edit2, Plus, Radio, Trash2, Type, X } from 'lucide-react';

interface RunningText {
    id: number;
    pesan: string;
    pesan_en: string | null;
    warna: string;
    prioritas: number;
    mulai_at: string | null;
    selesai_at: string | null;
    is_active: boolean;
    sedang_tayang: boolean;
}

interface Props {
    texts: RunningText[];
}

const PRESET_COLORS = ['#fbbf24', '#f87171', '#34d399', '#38bdf8', '#c4b5fd', '#ffffff'];

const EMPTY = {
    pesan: '',
    pesan_en: '',
    warna: '#fbbf24',
    prioritas: 0 as number | string,
    mulai_at: '',
    selesai_at: '',
    is_active: true,
};

export default function RunningTexts({ texts }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<RunningText | null>(null);
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({ ...EMPTY });

    const openModal = (t?: RunningText) => {
        clearErrors();
        if (t) {
            setEditing(t);
            setData({
                pesan: t.pesan,
                pesan_en: t.pesan_en ?? '',
                warna: t.warna,
                prioritas: t.prioritas,
                mulai_at: t.mulai_at ?? '',
                selesai_at: t.selesai_at ?? '',
                is_active: t.is_active,
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
            put(route('admin.taxi.running-texts.update', editing.id), { preserveScroll: true, onSuccess: close });
        } else {
            post(route('admin.taxi.running-texts.store'), { preserveScroll: true, onSuccess: close });
        }
    };

    const remove = async (t: RunningText) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Running Text',
            message: 'Pesan ini akan berhenti tayang di layar. Lanjutkan?',
            confirmText: 'Hapus', cancelText: 'Batal',
        });
        if (!ok) return;
        router.delete(route('admin.taxi.running-texts.destroy', t.id), { preserveScroll: true });
    };

    const tayang = texts.filter((t) => t.sedang_tayang).length;
    const terjadwal = texts.filter((t) => t.mulai_at || t.selesai_at).length;

    return (
        <TaxiShell
            title="Running Text"
            subtitle="Pesan berjalan di bagian bawah layar. Urutan mengikuti prioritas (nilai besar tampil lebih dulu) dan setiap pesan dapat dijadwalkan tayang pada rentang waktu tertentu."
            action={
                <button type="button" onClick={() => openModal()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition">
                    <Plus size={18} /> Tambah Pesan
                </button>
            }
            stats={
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <TaxiStat label="Total Pesan" value={texts.length} icon={<Type size={13} />} />
                    <TaxiStat label="Sedang Tayang" value={tayang} icon={<Radio size={13} />} />
                    <TaxiStat label="Terjadwal" value={terjadwal} icon={<CalendarClock size={13} />} />
                </div>
            }
        >
            {/* Pratinjau pita berjalan */}
            {tayang > 0 && (
                <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-slate-900">
                    <div className="flex items-stretch">
                        <div className="px-4 grid place-items-center bg-amber-500 text-slate-900 font-black text-xs uppercase tracking-[0.2em]">
                            Info
                        </div>
                        <div className="flex-1 overflow-hidden py-3">
                            <div className="flex w-max taxi-marquee" style={{ animationDuration: '40s' }}>
                                {[0, 1].map((dup) => (
                                    <span key={dup} className="flex items-center">
                                        {texts.filter((t) => t.sedang_tayang).map((t) => (
                                            <span key={`${t.id}-${dup}`} className="whitespace-nowrap mx-8 font-bold" style={{ color: t.warna }}>
                                                {t.pesan}
                                            </span>
                                        ))}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {texts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                    <Type size={28} className="mx-auto text-amber-500" />
                    <h5 className="mt-3 font-bold text-gray-700 dark:text-gray-200">Belum ada running text</h5>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-5 py-3 font-black">Pesan</th>
                                    <th className="px-5 py-3 font-black">Prioritas</th>
                                    <th className="px-5 py-3 font-black">Jadwal</th>
                                    <th className="px-5 py-3 font-black">Status</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {texts.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-5 py-3 max-w-md">
                                            <span className="flex items-center gap-2">
                                                <span className="h-3 w-3 rounded-full shrink-0 ring-1 ring-black/10" style={{ background: t.warna }} />
                                                <span className="font-semibold text-gray-900 dark:text-white truncate">{t.pesan}</span>
                                            </span>
                                            {t.pesan_en && <span className="block mt-0.5 text-xs text-gray-400 truncate">{t.pesan_en}</span>}
                                        </td>
                                        <td className="px-5 py-3 font-black tabular-nums text-gray-700 dark:text-gray-200">{t.prioritas}</td>
                                        <td className="px-5 py-3 text-xs text-gray-500">
                                            {t.mulai_at || t.selesai_at
                                                ? `${t.mulai_at?.replace('T', ' ') ?? '…'} → ${t.selesai_at?.replace('T', ' ') ?? '…'}`
                                                : 'Tanpa batas'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                t.sedang_tayang
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                    : t.is_active
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {t.sedang_tayang ? 'Tayang' : t.is_active ? 'Menunggu jadwal' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openModal(t)} className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30" title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => remove(t)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Hapus">
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
            )}

            <Modal show={open} onClose={close} maxWidth="lg">
                <form onSubmit={submit} className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {editing ? 'Edit Running Text' : 'Tambah Running Text'}
                        </h2>
                        <button type="button" onClick={close} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>

                    <Field label="Pesan (ID)" error={errors.pesan}>
                        <textarea rows={2} value={data.pesan} required
                                  onChange={(e) => setData('pesan', e.target.value)}
                                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:border-amber-500 focus:ring-amber-500"
                                  placeholder="Gunakan hanya taksi resmi bandara dengan tarif tertera." />
                    </Field>

                    <Field label="Pesan (EN, opsional)" error={errors.pesan_en}>
                        <textarea rows={2} value={data.pesan_en}
                                  onChange={(e) => setData('pesan_en', e.target.value)}
                                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:border-amber-500 focus:ring-amber-500" />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Warna teks" error={errors.warna}>
                            <div className="mt-2 flex items-center gap-2">
                                {PRESET_COLORS.map((c) => (
                                    <button key={c} type="button" onClick={() => setData('warna', c)}
                                            className={`h-7 w-7 rounded-full ring-2 transition ${data.warna === c ? 'ring-amber-500 scale-110' : 'ring-transparent'}`}
                                            style={{ background: c }} title={c} />
                                ))}
                                <input type="color" value={data.warna} onChange={(e) => setData('warna', e.target.value)}
                                       className="h-8 w-10 rounded border-gray-200 dark:border-gray-700 bg-transparent cursor-pointer" />
                            </div>
                        </Field>
                        <Field label="Prioritas (besar = lebih dulu)" error={errors.prioritas}>
                            <TextInput type="number" min={0} className="mt-1 block w-full" value={data.prioritas}
                                       onChange={(e) => setData('prioritas', e.target.value)} />
                        </Field>
                        <Field label="Mulai tayang" error={errors.mulai_at}>
                            <TextInput type="datetime-local" className="mt-1 block w-full" value={data.mulai_at}
                                       onChange={(e) => setData('mulai_at', e.target.value)} />
                        </Field>
                        <Field label="Berhenti tayang" error={errors.selesai_at}>
                            <TextInput type="datetime-local" className="mt-1 block w-full" value={data.selesai_at}
                                       onChange={(e) => setData('selesai_at', e.target.value)} />
                        </Field>
                    </div>

                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={data.is_active}
                               onChange={(e) => setData('is_active', e.target.checked)}
                               className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Aktif</span>
                    </label>

                    <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <SecondaryButton type="button" onClick={close}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>{editing ? 'Simpan' : 'Tambah'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </TaxiShell>
    );
}
