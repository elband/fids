import { useForm, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import {
    Clock, Server, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
    Activity, Wifi, WifiOff, History, Settings2, Zap,
} from 'lucide-react';

interface NtpSetting {
    id: number;
    ntp_server_1: string;
    ntp_server_2: string | null;
    ntp_server_3: string | null;
    sync_interval: number;
    auto_sync: boolean;
    last_sync_at: string | null;
    last_sync_status: string | null;
    last_offset_ms: number | null;
    last_delay_ms: number | null;
    last_server_used: string | null;
    last_error: string | null;
    sync_history: SyncHistoryEntry[] | null;
}

interface SyncHistoryEntry {
    timestamp: string;
    server: string;
    status: 'success' | 'failed';
    offset_ms: number | null;
    delay_ms: number | null;
    error: string | null;
}

const INTERVAL_OPTIONS = [
    { value: 60, label: '1 Menit' },
    { value: 300, label: '5 Menit' },
    { value: 600, label: '10 Menit' },
    { value: 1800, label: '30 Menit' },
    { value: 3600, label: '1 Jam' },
    { value: 7200, label: '2 Jam' },
    { value: 21600, label: '6 Jam' },
    { value: 43200, label: '12 Jam' },
    { value: 86400, label: '24 Jam' },
];

function StatusBadge({ status }: { status: string | null }) {
    if (!status) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <Clock size={12} />
                Belum pernah sync
            </span>
        );
    }
    if (status === 'success') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 size={12} />
                Tersinkronisasi
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle size={12} />
            Gagal
        </span>
    );
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export default function Index({ auth, setting }: PageProps<{ setting: NtpSetting }>) {
    const [syncing, setSyncing] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        ntp_server_1: setting.ntp_server_1 || 'id.pool.ntp.org',
        ntp_server_2: setting.ntp_server_2 || '',
        ntp_server_3: setting.ntp_server_3 || '',
        sync_interval: setting.sync_interval || 3600,
        auto_sync: setting.auto_sync ?? true,
        _method: 'POST',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.ntp-settings.update'), {
            preserveScroll: true,
        });
    };

    const handleSync = () => {
        setSyncing(true);
        router.post(route('admin.ntp-settings.sync'), {}, {
            preserveScroll: true,
            onFinish: () => setSyncing(false),
        });
    };

    const history = setting.sync_history ?? [];

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 leading-tight">Pengaturan NTP Server</h2>}
        >
            <Head title="Pengaturan NTP Server" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Status Card */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${setting.last_sync_status === 'success' ? 'bg-green-100 dark:bg-green-900/30' : setting.last_sync_status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                        <Activity size={24} className={setting.last_sync_status === 'success' ? 'text-green-600 dark:text-green-400' : setting.last_sync_status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Status Sinkronisasi NTP</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Waktu sistem akan disesuaikan dengan server NTP</p>
                                    </div>
                                </div>
                                <StatusBadge status={setting.last_sync_status} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                        <Clock size={14} />
                                        <span>Sinkronisasi Terakhir</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(setting.last_sync_at)}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                        <Server size={14} />
                                        <span>Server Digunakan</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{setting.last_server_used || '-'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                        <Zap size={14} />
                                        <span>Offset Waktu</span>
                                    </div>
                                    <p className={`text-sm font-medium ${setting.last_offset_ms !== null && Math.abs(setting.last_offset_ms) > 1000 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {setting.last_offset_ms !== null ? `${setting.last_offset_ms} ms` : '-'}
                                    </p>
                                    {setting.last_offset_ms !== null && Math.abs(setting.last_offset_ms) > 1000 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                            <AlertTriangle size={10} />
                                            Offset tinggi
                                        </p>
                                    )}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                        <Wifi size={14} />
                                        <span>Network Delay</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {setting.last_delay_ms !== null ? `${setting.last_delay_ms} ms` : '-'}
                                    </p>
                                </div>
                            </div>

                            {setting.last_error && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                                        <XCircle size={14} />
                                        <span className="font-medium">Error terakhir:</span>
                                    </div>
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{setting.last_error}</p>
                                </div>
                            )}

                            <div className="mt-6 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                                    {syncing ? 'Menyinkronkan...' : 'Sinkronisasi Sekarang'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Settings Form */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Settings2 size={20} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Konfigurasi Server NTP</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Atur alamat server NTP dan interval sinkronisasi</p>
                                </div>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <InputLabel htmlFor="ntp_server_1" value="Server NTP Utama *" />
                                        <TextInput
                                            id="ntp_server_1"
                                            className="mt-1 block w-full"
                                            value={data.ntp_server_1}
                                            onChange={(e: any) => setData('ntp_server_1', e.target.value)}
                                            placeholder="id.pool.ntp.org"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Server prioritas pertama</p>
                                        <InputError message={errors.ntp_server_1} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="ntp_server_2" value="Server NTP Cadangan 1" />
                                        <TextInput
                                            id="ntp_server_2"
                                            className="mt-1 block w-full"
                                            value={data.ntp_server_2}
                                            onChange={(e: any) => setData('ntp_server_2', e.target.value)}
                                            placeholder="ntp.bmkg.go.id"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fallback jika server utama gagal</p>
                                        <InputError message={errors.ntp_server_2} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="ntp_server_3" value="Server NTP Cadangan 2" />
                                        <TextInput
                                            id="ntp_server_3"
                                            className="mt-1 block w-full"
                                            value={data.ntp_server_3}
                                            onChange={(e: any) => setData('ntp_server_3', e.target.value)}
                                            placeholder="time.google.com"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fallback terakhir</p>
                                        <InputError message={errors.ntp_server_3} className="mt-2" />
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>Server NTP yang direkomendasikan untuk Indonesia:</strong>
                                    </p>
                                    <ul className="text-sm text-blue-600 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                                        <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">id.pool.ntp.org</code> — NTP Pool Indonesia</li>
                                        <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">ntp.bmkg.go.id</code> — BMKG Indonesia</li>
                                        <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">time.google.com</code> — Google Public NTP</li>
                                        <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">time.cloudflare.com</code> — Cloudflare NTP</li>
                                        <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">0.id.pool.ntp.org</code> — NTP Pool ID #0</li>
                                    </ul>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="sync_interval" value="Interval Sinkronisasi" />
                                        <select
                                            id="sync_interval"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            value={data.sync_interval}
                                            onChange={(e) => setData('sync_interval', parseInt(e.target.value))}
                                        >
                                            {INTERVAL_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Seberapa sering sistem menyinkronkan waktu</p>
                                        <InputError message={errors.sync_interval} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel value="Auto Sinkronisasi" />
                                        <div className="mt-3">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={data.auto_sync}
                                                    onChange={(e) => setData('auto_sync', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-500 peer-checked:bg-indigo-600"></div>
                                                <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {data.auto_sync ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Jika aktif, sistem akan otomatis sinkronisasi sesuai interval</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <PrimaryButton disabled={processing}>
                                        Simpan Pengaturan
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sync History */}
                    {history.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <History size={20} className="text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Riwayat Sinkronisasi</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">20 sinkronisasi terakhir</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waktu</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Server</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Offset</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Delay</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {history.map((entry, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                        {formatDate(entry.timestamp)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">{entry.server}</code>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {entry.status === 'success' ? (
                                                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                                                <CheckCircle2 size={14} /> Berhasil
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                                                                <XCircle size={14} /> Gagal
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        {entry.offset_ms !== null ? `${entry.offset_ms} ms` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        {entry.delay_ms !== null ? `${entry.delay_ms} ms` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                        {entry.error || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
