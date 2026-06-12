import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

type Props = {
    initialSettings?: {
        screen_title: string;
        layout_type: 'single' | '2-column' | '3-column';
        show_clock: boolean;
        show_weather: boolean;
        show_ticker: boolean;
        show_schedule_table: boolean;
        theme_color: string;
    };
};

export default function Index({ initialSettings }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        screen_title: initialSettings?.screen_title ?? 'FIDS Public Screen',
        layout_type: initialSettings?.layout_type ?? '2-column',
        show_clock: initialSettings?.show_clock ?? true,
        show_weather: initialSettings?.show_weather ?? true,
        show_ticker: initialSettings?.show_ticker ?? true,
        show_schedule_table: initialSettings?.show_schedule_table ?? true,
        theme_color: initialSettings?.theme_color ?? '#1e3a8a',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('admin.public-screen.editor.save'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Panel Kontrol TV Layar Publik
                </h2>
            }
        >
            <Head title="Panel Layar Publik" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <div>
                                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                    Pengaturan TV Layar Publik
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    Semua konfigurasi tampilan TV publik diatur dari panel ini.
                                </p>
                            </div>
                            <Link
                                href={route('admin.public-screen.index')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                            >
                                Lihat Realtime
                            </Link>
                        </div>

                        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Judul Layar
                                </label>
                                <input
                                    type="text"
                                    value={data.screen_title}
                                    onChange={(e) => setData('screen_title', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                />
                                {errors.screen_title && <p className="text-sm text-red-600 mt-1">{errors.screen_title}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Layout
                                </label>
                                <select
                                    value={data.layout_type}
                                    onChange={(e) => setData('layout_type', e.target.value as 'single' | '2-column' | '3-column')}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                >
                                    <option value="single">Single</option>
                                    <option value="2-column">2 Column</option>
                                    <option value="3-column">3 Column</option>
                                </select>
                                {errors.layout_type && <p className="text-sm text-red-600 mt-1">{errors.layout_type}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Warna Tema
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={data.theme_color}
                                        onChange={(e) => setData('theme_color', e.target.value)}
                                        className="h-10 w-16 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                                    />
                                    <input
                                        type="text"
                                        value={data.theme_color}
                                        onChange={(e) => setData('theme_color', e.target.value)}
                                        className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    />
                                </div>
                                {errors.theme_color && <p className="text-sm text-red-600 mt-1">{errors.theme_color}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <input type="checkbox" checked={data.show_clock} onChange={(e) => setData('show_clock', e.target.checked)} />
                                    Tampilkan Jam
                                </label>
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <input type="checkbox" checked={data.show_weather} onChange={(e) => setData('show_weather', e.target.checked)} />
                                    Tampilkan Cuaca
                                </label>
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <input type="checkbox" checked={data.show_ticker} onChange={(e) => setData('show_ticker', e.target.checked)} />
                                    Tampilkan Ticker
                                </label>
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <input type="checkbox" checked={data.show_schedule_table} onChange={(e) => setData('show_schedule_table', e.target.checked)} />
                                    Tampilkan Tabel Jadwal
                                </label>
                            </div>

                            <div className="lg:col-span-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Pengaturan TV'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
