import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import TaxiShell from './Partials/TaxiShell';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Field, FileInput } from './Directions';
import { Gauge, Languages, Palette, Save, Timer } from 'lucide-react';

interface Setting {
    id: number;
    judul_layar: string;
    warna_aksen: string;
    tema_warna: 'slate' | 'midnight' | 'teal' | 'plum';
    video_interval_detik: number;
    flight_refresh_detik: number;
    running_text_speed: number;
    scroll_detik_per_layar: number;
    bahasa: 'id' | 'en' | 'auto';
    bahasa_switch_detik: number;
    tampilkan_penerbangan: boolean;
    tampilkan_video: boolean;
    tampilkan_tarif: boolean;
    mode_hemat: boolean;
    logo_url: string | null;
    background_url: string | null;
}

interface Props {
    setting: Setting;
}

const THEMES = [
    { value: 'slate', label: 'Slate', swatch: 'linear-gradient(135deg,#0b1120,#111c33)' },
    { value: 'midnight', label: 'Midnight', swatch: 'linear-gradient(135deg,#050813,#0d1230)' },
    { value: 'teal', label: 'Teal', swatch: 'linear-gradient(135deg,#04191c,#062c30)' },
    { value: 'plum', label: 'Plum', swatch: 'linear-gradient(135deg,#150a1e,#251035)' },
] as const;

export default function Settings({ setting }: Props) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        judul_layar: setting.judul_layar,
        warna_aksen: setting.warna_aksen,
        tema_warna: setting.tema_warna,
        video_interval_detik: setting.video_interval_detik,
        flight_refresh_detik: setting.flight_refresh_detik,
        running_text_speed: setting.running_text_speed,
        scroll_detik_per_layar: setting.scroll_detik_per_layar,
        bahasa: setting.bahasa,
        bahasa_switch_detik: setting.bahasa_switch_detik,
        tampilkan_penerbangan: setting.tampilkan_penerbangan,
        tampilkan_video: setting.tampilkan_video,
        tampilkan_tarif: setting.tampilkan_tarif,
        mode_hemat: setting.mode_hemat,
        logo: null as File | null,
        background: null as File | null,
        hapus_logo: false,
        hapus_background: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.taxi.settings.update'), { forceFormData: true, preserveScroll: true });
    };

    return (
        <TaxiShell
            title="Pengaturan Display"
            subtitle="Tampilan, kecepatan animasi, interval penyegaran, dan bahasa layar signage taksi. Perubahan langsung diterapkan pada layar tanpa perlu reload manual."
        >
            <form onSubmit={submit} className="space-y-6">
                <Section title="Identitas & Tema" icon={<Palette size={16} className="text-amber-500" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Judul layar" error={errors.judul_layar}>
                            <TextInput className="mt-1 block w-full" value={data.judul_layar} required
                                       onChange={(e) => setData('judul_layar', e.target.value)} />
                        </Field>

                        <Field label="Warna aksen" error={errors.warna_aksen}>
                            <div className="mt-1 flex items-center gap-3">
                                <input type="color" value={data.warna_aksen}
                                       onChange={(e) => setData('warna_aksen', e.target.value)}
                                       className="h-10 w-14 rounded border-gray-200 dark:border-gray-700 bg-transparent cursor-pointer" />
                                <TextInput className="block w-full" value={data.warna_aksen}
                                           onChange={(e) => setData('warna_aksen', e.target.value)} />
                            </div>
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Tema latar" error={errors.tema_warna}>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {THEMES.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setData('tema_warna', t.value)}
                                            className={`rounded-xl p-3 border-2 transition text-left ${
                                                data.tema_warna === t.value
                                                    ? 'border-amber-500 ring-2 ring-amber-500/30'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                                            }`}
                                        >
                                            <span className="block h-10 rounded-lg" style={{ background: t.swatch }} />
                                            <span className="mt-2 block text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">
                                                {t.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        </div>

                        <Field label="Logo bandara" error={errors.logo}>
                            {setting.logo_url && (
                                <img src={setting.logo_url} alt="" className="mt-1 h-12 w-auto object-contain bg-slate-900 rounded p-1" />
                            )}
                            <FileInput accept="image/*" onChange={(f) => setData('logo', f)} />
                            {setting.logo_url && (
                                <Checkbox checked={data.hapus_logo} onChange={(v) => setData('hapus_logo', v)}>
                                    Hapus logo saat ini
                                </Checkbox>
                            )}
                        </Field>

                        <Field label="Background layar" error={errors.background}>
                            {setting.background_url && (
                                <img src={setting.background_url} alt="" className="mt-1 h-12 w-24 object-cover rounded" />
                            )}
                            <FileInput accept="image/*" onChange={(f) => setData('background', f)} />
                            {setting.background_url && (
                                <Checkbox checked={data.hapus_background} onChange={(v) => setData('hapus_background', v)}>
                                    Hapus background saat ini
                                </Checkbox>
                            )}
                        </Field>
                    </div>
                </Section>

                <Section title="Waktu & Interval" icon={<Timer size={16} className="text-amber-500" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                        <Field label="Interval pergantian video (detik)" error={errors.video_interval_detik}>
                            <TextInput type="number" min={0} max={3600} className="mt-1 block w-full" value={data.video_interval_detik}
                                       onChange={(e) => setData('video_interval_detik', Number(e.target.value))} />
                            <p className="mt-1 text-[11px] text-gray-400">0 = putar sampai video selesai.</p>
                        </Field>
                        <Field label="Refresh jadwal penerbangan (detik)" error={errors.flight_refresh_detik}>
                            <TextInput type="number" min={5} max={600} className="mt-1 block w-full" value={data.flight_refresh_detik}
                                       onChange={(e) => setData('flight_refresh_detik', Number(e.target.value))} />
                        </Field>
                        <Field label="Durasi satu putaran running text (detik)" error={errors.running_text_speed}>
                            <TextInput type="number" min={10} max={600} className="mt-1 block w-full" value={data.running_text_speed}
                                       onChange={(e) => setData('running_text_speed', Number(e.target.value))} />
                            <p className="mt-1 text-[11px] text-gray-400">Makin besar = makin lambat.</p>
                        </Field>
                        <Field label="Kecepatan gulir panel (detik)" error={errors.scroll_detik_per_layar}>
                            <TextInput type="number" min={5} max={600} className="mt-1 block w-full" value={data.scroll_detik_per_layar}
                                       onChange={(e) => setData('scroll_detik_per_layar', Number(e.target.value))} />
                            <p className="mt-1 text-[11px] text-gray-400">
                                Lama menggulir sejauh satu tinggi panel jadwal &amp; tarif. Makin besar = makin lambat.
                            </p>
                        </Field>
                    </div>
                </Section>

                <Section title="Bahasa" icon={<Languages size={16} className="text-amber-500" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Mode bahasa" error={errors.bahasa}>
                            <select value={data.bahasa}
                                    onChange={(e) => setData('bahasa', e.target.value as Setting['bahasa'])}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:border-amber-500 focus:ring-amber-500">
                                <option value="auto">Otomatis bergantian (ID ⇄ EN)</option>
                                <option value="id">Bahasa Indonesia saja</option>
                                <option value="en">English only</option>
                            </select>
                        </Field>
                        <Field label="Interval pergantian bahasa (detik)" error={errors.bahasa_switch_detik}>
                            <TextInput type="number" min={5} max={600} className="mt-1 block w-full" value={data.bahasa_switch_detik}
                                       disabled={data.bahasa !== 'auto'}
                                       onChange={(e) => setData('bahasa_switch_detik', Number(e.target.value))} />
                        </Field>
                    </div>
                </Section>

                <Section title="Panel & Performa" icon={<Gauge size={16} className="text-amber-500" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Toggle checked={data.tampilkan_penerbangan} onChange={(v) => setData('tampilkan_penerbangan', v)}
                                title="Panel jadwal penerbangan" desc="Data realtime dari modul FIDS (hanya dibaca)." />
                        <Toggle checked={data.tampilkan_video} onChange={(v) => setData('tampilkan_video', v)}
                                title="Panel video digital signage" desc="Playlist promosi diputar otomatis." />
                        <Toggle checked={data.tampilkan_tarif} onChange={(v) => setData('tampilkan_tarif', v)}
                                title="Panel tarif taksi" desc="Tarif berlaku dikelompokkan per wilayah." />
                        <Toggle checked={data.mode_hemat} onChange={(v) => setData('mode_hemat', v)}
                                title="Mode hemat (Raspberry Pi)" desc="Matikan animasi berat agar layar tetap mulus di perangkat berdaya rendah." />
                    </div>
                </Section>

                <div className="flex items-center justify-end gap-3">
                    {recentlySuccessful && (
                        <span className="text-sm font-semibold text-emerald-600">Tersimpan.</span>
                    )}
                    <PrimaryButton disabled={processing} className="!bg-amber-500 hover:!bg-amber-600 !text-slate-900">
                        <Save size={16} className="mr-2" /> Simpan Pengaturan
                    </PrimaryButton>
                </div>
            </form>
        </TaxiShell>
    );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
                {icon}
                <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
            </div>
            {children}
        </div>
    );
}

function Toggle({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
    return (
        <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
            checked ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700'
        }`}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
                   className="mt-0.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
            <span>
                <span className="block text-sm font-bold text-gray-800 dark:text-gray-100">{title}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
            </span>
        </label>
    );
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
    return (
        <label className="mt-2 inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
                   className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
            <span className="text-xs text-gray-500">{children}</span>
        </label>
    );
}
