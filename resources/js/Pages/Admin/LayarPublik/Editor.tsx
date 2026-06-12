import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, ExternalLink, Monitor } from 'lucide-react';

type EditorSettings = {
    screen_title: string;
    layout_type: 'single' | '2-column' | '3-column';
    show_clock: boolean;
    show_weather: boolean;
    show_ticker: boolean;
    show_departures: boolean;
    show_arrivals: boolean;
    theme_color: string;
};

type EditorPageProps = {
    initialSettings?: EditorSettings;
    flash?: {
        success?: string;
        error?: string;
    };
};

export default function Editor() {
    const { props } = usePage();
    const pageProps = props as unknown as EditorPageProps;
    const [showNotification, setShowNotification] = useState(false);
    const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

    const { data, setData, post, processing, errors } = useForm<EditorSettings>({
        screen_title: pageProps.initialSettings?.screen_title ?? 'FIDS Public Screen',
        layout_type: pageProps.initialSettings?.layout_type ?? '2-column',
        show_clock: pageProps.initialSettings?.show_clock ?? true,
        show_weather: pageProps.initialSettings?.show_weather ?? true,
        show_ticker: pageProps.initialSettings?.show_ticker ?? true,
        show_departures: pageProps.initialSettings?.show_departures ?? true,
        show_arrivals: pageProps.initialSettings?.show_arrivals ?? true,
        theme_color: pageProps.initialSettings?.theme_color ?? '#1e3a8a',
    });

    // Show notification when flash message appears
    useEffect(() => {
        if (pageProps.flash?.success) {
            setNotificationType('success');
            setShowNotification(true);
            const timer = setTimeout(() => setShowNotification(false), 4000);
            return () => clearTimeout(timer);
        }
        if (pageProps.flash?.error) {
            setNotificationType('error');
            setShowNotification(true);
            const timer = setTimeout(() => setShowNotification(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [pageProps.flash?.success, pageProps.flash?.error]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/admin/public-screen/editor');
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Editor Layar Publik
                </h2>
            }
        >
            <Head title="Editor Layar Publik" />

            {/* Toast Notification */}
            {showNotification && (
                <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-md ${
                        notificationType === 'success' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}>
                        {notificationType === 'success' ? (
                            <>
                                <CheckCircle className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" size={20} />
                                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                                    {pageProps.flash?.success}
                                </p>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                    {pageProps.flash?.error}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pengaturan Tampilan</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Atur komponen apa saja yang akan ditampilkan di layar publik.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Judul Layar
                                </label>
                                <input
                                    type="text"
                                    value={data.screen_title}
                                    onChange={(e) => setData('screen_title', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.screen_title && (
                                    <p className="text-sm text-red-600 mt-1">{errors.screen_title}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Jenis Layout
                                </label>
                                <select
                                    value={data.layout_type}
                                    onChange={(e) => setData('layout_type', e.target.value as EditorSettings['layout_type'])}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="single">Single</option>
                                    <option value="2-column">2 Column</option>
                                    <option value="3-column">3 Column</option>
                                </select>
                                {errors.layout_type && (
                                    <p className="text-sm text-red-600 mt-1">{errors.layout_type}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Komponen
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={data.show_clock}
                                            onChange={(e) => setData('show_clock', e.target.checked)}
                                        />
                                        Tampilkan Jam
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={data.show_weather}
                                            onChange={(e) => setData('show_weather', e.target.checked)}
                                        />
                                        Tampilkan Cuaca
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={data.show_ticker}
                                            onChange={(e) => setData('show_ticker', e.target.checked)}
                                        />
                                        Tampilkan Ticker
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={data.show_departures}
                                            onChange={(e) => setData('show_departures', e.target.checked)}
                                        />
                                        Tampilkan Keberangkatan
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={data.show_arrivals}
                                            onChange={(e) => setData('show_arrivals', e.target.checked)}
                                        />
                                        Tampilkan Kedatangan
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Warna Tema
                                </label>
                                <input
                                    type="color"
                                    value={data.theme_color}
                                    onChange={(e) => setData('theme_color', e.target.value)}
                                    className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                                />
                                {errors.theme_color && (
                                    <p className="text-sm text-red-600 mt-1">{errors.theme_color}</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-2 flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                            >
                                {processing ? (
                                    <>
                                        <span className="inline-block animate-spin mr-2">⏳</span>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={18} className="mr-2" />
                                        Simpan & Update Realtime
                                    </>
                                )}
                            </button>

                            <a 
                                href={route('display.public-screen')} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm"
                            >
                                <Monitor size={18} />
                                Buka Monitor (TV)
                            </a>
                        </div>
                    </form>

                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Preview Sederhana</h3>
                        <div className="rounded-lg p-4 min-h-[280px]" style={{ backgroundColor: data.theme_color }}>
                            <p className="text-white font-bold mb-3">{data.screen_title}</p>
                            <p className="text-white/90 text-sm mb-2">Layout: {data.layout_type}</p>
                            <ul className="text-white/90 text-sm space-y-1">
                                {data.show_clock && <li>• Jam aktif</li>}
                                {data.show_weather && <li>• Cuaca aktif</li>}
                                {data.show_ticker && <li>• Ticker aktif</li>}
                                {data.show_departures && <li>• Tabel keberangkatan aktif</li>}
                                {data.show_arrivals && <li>• Tabel kedatangan aktif</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
