import { router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import TaxiShell from './Partials/TaxiShell';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { appConfirm } from '@/lib/confirm';
import { Edit2, Eye, EyeOff, Footprints, Map, Plus, QrCode, Signpost, Timer, Trash2, X } from 'lucide-react';

interface Direction {
    id: number;
    judul: string;
    judul_en: string | null;
    deskripsi: string | null;
    deskripsi_en: string | null;
    gambar_path: string | null;
    denah_path: string | null;
    qr_path: string | null;
    qr_url: string | null;
    jarak_meter: number | null;
    estimasi_menit: number | null;
    is_active: boolean;
    order_index: number;
}

interface Props {
    directions: Direction[];
}

const EMPTY = {
    judul: '',
    judul_en: '',
    deskripsi: '',
    deskripsi_en: '',
    gambar: null as File | null,
    denah: null as File | null,
    qr: null as File | null,
    qr_url: '',
    jarak_meter: '' as number | string,
    estimasi_menit: '' as number | string,
    is_active: true as boolean,
    order_index: '' as number | string,
};

export default function Directions({ directions }: Props) {
    const [editing, setEditing] = useState<Direction | null>(null);
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors, transform } = useForm({ ...EMPTY });

    const openModal = (d?: Direction) => {
        clearErrors();
        if (d) {
            setEditing(d);
            setData({
                judul: d.judul,
                judul_en: d.judul_en ?? '',
                deskripsi: d.deskripsi ?? '',
                deskripsi_en: d.deskripsi_en ?? '',
                gambar: null, denah: null, qr: null,
                qr_url: d.qr_url ?? '',
                jarak_meter: d.jarak_meter ?? '',
                estimasi_menit: d.estimasi_menit ?? '',
                is_active: d.is_active,
                order_index: d.order_index,
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
        // Unggahan berkas dikirim sebagai FormData; rute PUT dicapai lewat
        // _method spoofing karena PHP tidak mem-parse body PUT multipart.
        transform((d) => ({
            ...d,
            is_active: d.is_active ? 1 : 0,
            ...(editing ? { _method: 'PUT' } : {}),
        }));

        post(
            editing
                ? route('admin.taxi.directions.update', editing.id)
                : route('admin.taxi.directions.store'),
            { forceFormData: true, preserveScroll: true, onSuccess: close },
        );
    };

    const remove = async (d: Direction) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Petunjuk Arah',
            message: `Hapus "${d.judul}" beserta gambar, denah, dan QR-nya?`,
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        router.delete(route('admin.taxi.directions.destroy', d.id), { preserveScroll: true });
    };

    return (
        <TaxiShell
            title="Petunjuk Arah Counter Taksi"
            subtitle="Gambar denah, jarak, estimasi jalan kaki, dan QR lokasi yang tampil pada panel terbesar layar signage. Bila lebih dari satu, layar menampilkannya bergantian."
            action={
                <button
                    type="button"
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition"
                >
                    <Plus size={18} /> Tambah Petunjuk
                </button>
            }
        >
            {directions.length === 0 ? (
                <EmptyState onAdd={() => openModal()} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {directions.map((d) => (
                        <div key={d.id} className="rounded-2xl bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
                            <div className="relative aspect-video bg-slate-900">
                                {(d.denah_path || d.gambar_path) ? (
                                    <img
                                        src={`/storage/${d.denah_path ?? d.gambar_path}`}
                                        alt=""
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 grid place-items-center text-white/25">
                                        <Map size={30} />
                                    </div>
                                )}
                                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    d.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white/80'
                                }`}>
                                    {d.is_active ? 'Tayang' : 'Nonaktif'}
                                </span>
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-black tabular-nums">
                                    #{d.order_index}
                                </span>
                            </div>

                            <div className="p-4 space-y-3">
                                <div>
                                    <h5 className="font-bold text-gray-900 dark:text-white truncate">{d.judul}</h5>
                                    {d.deskripsi && (
                                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{d.deskripsi}</p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                                    {d.jarak_meter !== null && (
                                        <Chip icon={<Footprints size={12} />}>{d.jarak_meter} m</Chip>
                                    )}
                                    {d.estimasi_menit !== null && (
                                        <Chip icon={<Timer size={12} />}>{d.estimasi_menit} menit</Chip>
                                    )}
                                    {d.qr_path && <Chip icon={<QrCode size={12} />}>QR</Chip>}
                                    <Chip icon={d.is_active ? <Eye size={12} /> : <EyeOff size={12} />}>
                                        {d.judul_en ? 'ID / EN' : 'ID'}
                                    </Chip>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        onClick={() => openModal(d)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white transition border border-amber-100 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/40"
                                    >
                                        <Edit2 size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => remove(d)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                        title="Hapus"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal show={open} onClose={close} maxWidth="2xl">
                <form onSubmit={submit} className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editing ? 'Edit Petunjuk Arah' : 'Tambah Petunjuk Arah'}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Isian bahasa Inggris opsional — dipakai saat layar berganti bahasa otomatis.
                            </p>
                        </div>
                        <button type="button" onClick={close} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Judul (ID)" error={errors.judul}>
                            <TextInput className="mt-1 block w-full" value={data.judul} required
                                       onChange={(e) => setData('judul', e.target.value)}
                                       placeholder="Counter Taksi Resmi — Pintu Kedatangan A" />
                        </Field>
                        <Field label="Judul (EN)" error={errors.judul_en}>
                            <TextInput className="mt-1 block w-full" value={data.judul_en}
                                       onChange={(e) => setData('judul_en', e.target.value)}
                                       placeholder="Official Taxi Counter — Arrival Gate A" />
                        </Field>

                        <Field label="Deskripsi (ID)" error={errors.deskripsi}>
                            <textarea rows={3} value={data.deskripsi}
                                      onChange={(e) => setData('deskripsi', e.target.value)}
                                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:border-amber-500 focus:ring-amber-500"
                                      placeholder="Ikuti koridor kedatangan lalu belok kanan setelah area bagasi." />
                        </Field>
                        <Field label="Deskripsi (EN)" error={errors.deskripsi_en}>
                            <textarea rows={3} value={data.deskripsi_en}
                                      onChange={(e) => setData('deskripsi_en', e.target.value)}
                                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:border-amber-500 focus:ring-amber-500" />
                        </Field>

                        <Field label="Jarak (meter)" error={errors.jarak_meter}>
                            <TextInput type="number" min={0} className="mt-1 block w-full" value={data.jarak_meter}
                                       onChange={(e) => setData('jarak_meter', e.target.value)} placeholder="120" />
                        </Field>
                        <Field label="Estimasi jalan kaki (menit)" error={errors.estimasi_menit}>
                            <TextInput type="number" min={0} className="mt-1 block w-full" value={data.estimasi_menit}
                                       onChange={(e) => setData('estimasi_menit', e.target.value)} placeholder="3" />
                        </Field>

                        <Field label={`Foto petunjuk ${editing ? '(kosongkan bila tidak diganti)' : ''}`} error={errors.gambar}>
                            <FileInput accept="image/*" onChange={(f) => setData('gambar', f)} />
                        </Field>
                        <Field label={`Denah / peta ${editing ? '(kosongkan bila tidak diganti)' : ''}`} error={errors.denah}>
                            <FileInput accept="image/*" onChange={(f) => setData('denah', f)} />
                            <p className="mt-1 text-[11px] text-gray-400">Denah diprioritaskan tampil di layar.</p>
                        </Field>

                        <Field label="Gambar QR Code" error={errors.qr}>
                            <FileInput accept="image/*" onChange={(f) => setData('qr', f)} />
                        </Field>
                        <Field label="Tautan yang diwakili QR" error={errors.qr_url}>
                            <TextInput className="mt-1 block w-full" value={data.qr_url}
                                       onChange={(e) => setData('qr_url', e.target.value)}
                                       placeholder="https://maps.app.goo.gl/..." />
                        </Field>

                        <Field label="Urutan tampil" error={errors.order_index}>
                            <TextInput type="number" min={0} className="mt-1 block w-full" value={data.order_index}
                                       onChange={(e) => setData('order_index', e.target.value)} />
                        </Field>
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
                        <PrimaryButton disabled={processing}>{editing ? 'Simpan Perubahan' : 'Tambah'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </TaxiShell>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/30 grid place-items-center mx-auto mb-4">
                <Signpost size={28} className="text-amber-500" />
            </div>
            <h5 className="text-base font-bold text-gray-700 dark:text-gray-200">Belum ada petunjuk arah</h5>
            <p className="text-sm text-gray-500 mt-1">Tambahkan denah menuju counter taksi agar panel utama layar terisi.</p>
            <button onClick={onAdd} className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-900 text-sm font-bold hover:bg-amber-600 transition">
                <Plus size={16} /> Tambah Petunjuk
            </button>
        </div>
    );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <InputLabel value={label} />
            {children}
            <InputError message={error} className="mt-1" />
        </div>
    );
}

export function FileInput({ accept, onChange }: { accept: string; onChange: (file: File | null) => void }) {
    return (
        <input
            type="file"
            accept={accept}
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-gray-700 dark:file:text-gray-200"
        />
    );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {icon}{children}
        </span>
    );
}
