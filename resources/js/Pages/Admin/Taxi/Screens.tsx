import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import TaxiShell, { TaxiStat } from './Partials/TaxiShell';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import { Field } from './Directions';
import { appConfirm } from '@/lib/confirm';
import { Edit2, MonitorSmartphone, Trash2, Wifi, WifiOff, X } from 'lucide-react';

interface Screen {
    id: number;
    kode: string;
    nama: string | null;
    lokasi: string | null;
    ip_address: string | null;
    resolusi: string | null;
    online: boolean;
    last_seen_at: string | null;
}

interface Props {
    screens: Screen[];
    offlineAfterSeconds: number;
}

/** Segarkan daftar berkala supaya status online/offline tetap mutakhir. */
const REFRESH_MS = 20000;

export default function Screens({ screens, offlineAfterSeconds }: Props) {
    const [editing, setEditing] = useState<Screen | null>(null);
    const [form, setForm] = useState({ nama: '', lokasi: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => router.reload({ only: ['screens'] }), REFRESH_MS);
        return () => clearInterval(timer);
    }, []);

    const openModal = (s: Screen) => {
        setEditing(s);
        setForm({ nama: s.nama ?? '', lokasi: s.lokasi ?? '' });
    };

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        setSaving(true);
        router.put(route('admin.taxi.screens.update', editing.id), form, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: () => setEditing(null),
        });
    };

    const remove = async (s: Screen) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Layar',
            message: `Hapus "${s.nama || s.kode}" dari monitoring? Layar akan muncul lagi bila mengirim heartbeat.`,
            confirmText: 'Hapus', cancelText: 'Batal',
        });
        if (!ok) return;
        router.delete(route('admin.taxi.screens.destroy', s.id), { preserveScroll: true });
    };

    const online = screens.filter((s) => s.online).length;

    return (
        <TaxiShell
            title="Monitoring Layar Signage"
            subtitle={`Layar mendaftar sendiri saat dibuka dengan parameter ?screen=kode-layar dan mengirim denyut tiap 45 detik. Layar dianggap offline bila tidak terdengar lebih dari ${offlineAfterSeconds} detik.`}
            stats={
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <TaxiStat label="Total Layar" value={screens.length} icon={<MonitorSmartphone size={13} />} />
                    <TaxiStat label="Online" value={online} icon={<Wifi size={13} />} />
                    <TaxiStat label="Offline" value={screens.length - online} icon={<WifiOff size={13} />} />
                </div>
            }
        >
            {screens.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                    <MonitorSmartphone size={28} className="mx-auto text-amber-500" />
                    <h5 className="mt-3 font-bold text-gray-700 dark:text-gray-200">Belum ada layar terdaftar</h5>
                    <p className="text-sm text-gray-500 mt-1">
                        Buka layar di perangkat display dengan alamat seperti{' '}
                        <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs">
                            /public/taxi?screen=kedatangan-1
                        </code>
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {screens.map((s) => (
                        <div key={s.id} className={`rounded-2xl p-5 border shadow-sm bg-white dark:bg-gray-800 ${
                            s.online ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-100 dark:border-gray-700'
                        }`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h5 className="font-bold text-gray-900 dark:text-white truncate">{s.nama || s.kode}</h5>
                                    <p className="text-xs text-gray-400 font-mono truncate">{s.kode}</p>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${
                                    s.online
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                }`}>
                                    {s.online ? <Wifi size={11} /> : <WifiOff size={11} />}
                                    {s.online ? 'Online' : 'Offline'}
                                </span>
                            </div>

                            <dl className="mt-4 space-y-1.5 text-xs">
                                <Row label="Lokasi" value={s.lokasi || '—'} />
                                <Row label="Resolusi" value={s.resolusi || '—'} />
                                <Row label="IP" value={s.ip_address || '—'} />
                                <Row label="Sinkron terakhir" value={
                                    s.last_seen_at ? new Date(s.last_seen_at).toLocaleString('id-ID') : 'Belum pernah'
                                } />
                            </dl>

                            <div className="mt-4 flex items-center gap-2">
                                <button onClick={() => openModal(s)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white transition border border-amber-100 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/40">
                                    <Edit2 size={12} /> Beri Nama
                                </button>
                                <button onClick={() => remove(s)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Hapus">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal show={editing !== null} onClose={() => setEditing(null)} maxWidth="md">
                <form onSubmit={save} className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Identitas Layar</h2>
                            <p className="text-xs text-gray-500 mt-0.5 font-mono">{editing?.kode}</p>
                        </div>
                        <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <Field label="Nama layar">
                        <TextInput className="mt-1 block w-full" value={form.nama}
                                   onChange={(e) => setForm({ ...form, nama: e.target.value })}
                                   placeholder="Layar Kedatangan 1" />
                    </Field>
                    <Field label="Lokasi">
                        <TextInput className="mt-1 block w-full" value={form.lokasi}
                                   onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                                   placeholder="Hall Kedatangan, dekat pintu B" />
                    </Field>

                    <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <SecondaryButton type="button" onClick={() => setEditing(null)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={saving}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </TaxiShell>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-gray-400 uppercase tracking-wider font-bold text-[10px]">{label}</dt>
            <dd className="text-gray-700 dark:text-gray-300 truncate">{value}</dd>
        </div>
    );
}
