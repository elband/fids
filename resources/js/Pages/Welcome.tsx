import { Head, usePage } from '@inertiajs/react';
import {
    PlaneTakeoff, PlaneLanding, ClipboardCheck, Building2, Luggage,
    MonitorPlay, LayoutDashboard, Camera as CameraIcon,
    Tv, Globe, Plane, Radio, ShieldAlert, Info,
} from 'lucide-react';
import { useNtpClock } from '@/hooks/useNtpClock';

// ─── Animations ────────────────────────────────────────────────────────────
const CSS = `
@keyframes float-bubble {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-9px); }
}
@keyframes center-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.22), 0 0 50px rgba(100,200,255,0.12); }
    60%       { box-shadow: 0 0 0 16px rgba(255,255,255,0), 0 0 50px rgba(100,200,255,0.18); }
}
@keyframes ring-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}
@keyframes ring-rev {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
}
@keyframes dot-breathe {
    0%, 100% { opacity: 0.07; }
    50%       { opacity: 0.14; }
}
@keyframes line-pulse {
    0%, 100% { opacity: 0.12; }
    50%       { opacity: 0.28; }
}
@keyframes bg-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
@keyframes live-ping {
    0%        { transform: scale(1);   opacity: 0.75; }
    70%, 100% { transform: scale(2.2); opacity: 0; }
}
`;

// ─── Orbital geometry ──────────────────────────────────────────────────────
const CX = 280;
const CY = 280;
const ORBIT_R = 210;
const CONTAINER = 560;
const BUBBLE = 102;
const CENTER_D = 144;

function orbPos(i: number, total: number) {
    const angle = ((i * 360 / total) - 90) * (Math.PI / 180);
    return {
        cx: Math.round(CX + Math.cos(angle) * ORBIT_R),
        cy: Math.round(CY + Math.sin(angle) * ORBIT_R),
    };
}

// ─── Display items ─────────────────────────────────────────────────────────
type Item = { title: string; badge: string; icon: React.ReactNode; href: string; ic: string; bg: string };

const DISPLAYS: Item[] = [
    { title: 'Jadwal Keberangkatan', badge: 'Departure',  icon: <PlaneTakeoff size={26} />, href: '/public/flight/departure',           ic: 'text-sky-600',     bg: 'bg-sky-50'     },
    { title: 'Jadwal Kedatangan',    badge: 'Arrival',    icon: <PlaneLanding size={26} />, href: '/public/flight/arrival',             ic: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Check-in Counters',   badge: 'Check-in',   icon: <ClipboardCheck size={26}/>, href: '/public/gate/checkin/details',      ic: 'text-amber-600',   bg: 'bg-amber-50'   },
    { title: 'Boarding Gates',      badge: 'Gates',      icon: <Building2 size={26} />,     href: '/public/gate/boarding/details',     ic: 'text-violet-600',  bg: 'bg-violet-50'  },
    { title: 'Baggage Claims',      badge: 'Bagasi',     icon: <Luggage size={26} />,       href: '/public/gate/baggageclaim/details', ic: 'text-teal-600',    bg: 'bg-teal-50'    },
    { title: 'CCTV Bagasi',         badge: 'CCTV',       icon: <CameraIcon size={26} />,    href: '/public/cctv/baggage',              ic: 'text-rose-600',    bg: 'bg-rose-50'    },
    { title: 'Advertisement',       badge: 'Ads',        icon: <Tv size={26} />,            href: '/public/advertisement',            ic: 'text-orange-600',  bg: 'bg-orange-50'  },
    { title: 'Layar All-in-One',    badge: 'All-in-One', icon: <MonitorPlay size={26} />,   href: '/public/screen',                   ic: 'text-indigo-600',  bg: 'bg-indigo-50'  },
    { title: 'World Clock',         badge: 'Clock',      icon: <Globe size={26} />,         href: '/public/world-clock',              ic: 'text-cyan-600',    bg: 'bg-cyan-50'    },
];

// ─── Component ─────────────────────────────────────────────────────────────
export default function Welcome() {
    const { auth, namaBandara } = usePage().props as any;
    const logoBandara = (usePage().props as any).logoBandara as string | null;
    const { time24h, dateFullId } = useNtpClock();
    const airport: string = namaBandara ?? 'FIDS Airport';

    return (
        <>
            <Head title={`FIDS — ${airport}`} />
            <style>{CSS}</style>

            <div
                className="min-h-screen flex flex-col relative overflow-hidden"
                style={{
                    background: 'linear-gradient(150deg, #52c8f4 0%, #1a72d5 38%, #0c3f96 72%, #071e56 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'bg-shift 18s ease infinite',
                }}
            >
                {/* Dot grid background */}
                <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.13) 1.5px, transparent 1.5px)',
                        backgroundSize: '28px 28px',
                        animation: 'dot-breathe 5s ease-in-out infinite',
                    }}
                />

                {/* Center radial glow */}
                <div
                    aria-hidden
                    className="absolute pointer-events-none"
                    style={{
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -44%)',
                        width: 800, height: 800,
                        background: 'radial-gradient(circle, rgba(120,210,255,0.10) 0%, transparent 68%)',
                    }}
                />

                {/* ── HEADER ─────────────────────────────────────────── */}
                <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-4">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        {logoBandara ? (
                            <img src={logoBandara} alt="logo" className="h-10 w-auto object-contain drop-shadow" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/20 ring-1 ring-white/30 flex items-center justify-center shrink-0">
                                <Plane size={20} className="text-white" style={{ transform: 'rotate(-45deg)' }} />
                            </div>
                        )}
                        <div className="leading-tight">
                            <p className="text-white font-bold text-sm sm:text-base tracking-wide drop-shadow">
                                {airport.toUpperCase()}
                            </p>
                            <p className="text-white/55 text-[10px] tracking-[0.22em] font-semibold uppercase">
                                Flight Information Display System
                            </p>
                        </div>
                    </div>

                    {/* Clock + login */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                                      style={{ animation: 'live-ping 1.6s cubic-bezier(0,0,.2,1) infinite' }} />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                            </span>
                            <span className="text-white font-mono text-sm font-semibold tabular-nums">{time24h}</span>
                            <span className="text-white/50 text-[10px] font-bold tracking-wider">WITA</span>
                        </div>

                        {auth.user ? (
                            <a href="/admin/dashboard"
                               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-blue-900 text-sm font-bold hover:bg-blue-50 transition-colors shadow-lg">
                                <LayoutDashboard size={14} />
                                Dashboard
                            </a>
                        ) : (
                            <a href="/login"
                               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold ring-1 ring-white/25 backdrop-blur-sm transition-colors">
                                <ShieldAlert size={14} />
                                Masuk Admin
                            </a>
                        )}
                    </div>
                </header>

                {/* ── HERO TAGLINE ───────────────────────────────────── */}
                <div className="relative z-10 text-center pt-2 pb-1 px-4">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                        Selamat Datang di <span className="text-sky-200">FIDS</span>
                    </h1>
                    <p className="text-white/55 text-xs sm:text-sm mt-1 tracking-wide">
                        Sistem Informasi Tampilan Penerbangan Terpadu
                    </p>
                    <p className="text-white/35 text-[10px] mt-1 uppercase tracking-[0.3em]">{dateFullId}</p>
                </div>

                {/* ── ORBITAL LAYOUT (lg+) ───────────────────────────── */}
                <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
                    <div className="relative" style={{ width: CONTAINER, height: CONTAINER }}>

                        {/* SVG: orbit ring + spoke lines */}
                        <svg
                            className="absolute inset-0 pointer-events-none"
                            width={CONTAINER} height={CONTAINER}
                        >
                            {/* Orbit ring */}
                            <circle
                                cx={CX} cy={CY} r={ORBIT_R}
                                fill="none" stroke="rgba(255,255,255,0.10)"
                                strokeWidth="1" strokeDasharray="3 7"
                            />
                            {/* Spoke lines */}
                            {DISPLAYS.map((_, i) => {
                                const { cx, cy } = orbPos(i, DISPLAYS.length);
                                return (
                                    <line key={i}
                                          x1={CX} y1={CY} x2={cx} y2={cy}
                                          stroke="rgba(255,255,255,0.14)"
                                          strokeWidth="1"
                                          strokeDasharray="4 9"
                                          style={{
                                              animation: 'line-pulse 4s ease-in-out infinite',
                                              animationDelay: `${i * 0.4}s`,
                                          }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Center circle */}
                        <div
                            className="absolute"
                            style={{
                                left: CX - CENTER_D / 2,
                                top:  CY - CENTER_D / 2,
                                width: CENTER_D,
                                height: CENTER_D,
                            }}
                        >
                            {/* Outer spinning ring */}
                            <div
                                className="absolute inset-0 rounded-full border-[1.5px] border-transparent"
                                style={{
                                    borderTopColor: 'rgba(125,211,252,0.7)',
                                    borderRightColor: 'rgba(125,211,252,0.2)',
                                    animation: 'ring-slow 6s linear infinite',
                                }}
                            />
                            {/* Inner counter-ring */}
                            <div
                                className="absolute inset-[6px] rounded-full border border-white/15"
                                style={{ animation: 'ring-rev 10s linear infinite' }}
                            />
                            {/* Core */}
                            <div
                                className="absolute inset-[3px] rounded-full bg-white/20 backdrop-blur-md ring-[2.5px] ring-white/40 flex flex-col items-center justify-center gap-0.5"
                                style={{ animation: 'center-pulse 3s ease-in-out infinite' }}
                            >
                                {logoBandara ? (
                                    <img src={logoBandara} alt="logo" className="w-12 h-12 object-contain drop-shadow" />
                                ) : (
                                    <Plane size={36} className="text-white drop-shadow-lg" style={{ transform: 'rotate(-45deg)' }} />
                                )}
                                <span className="text-white font-black text-[13px] tracking-[0.18em] drop-shadow">FIDS</span>
                                <span className="text-white/65 text-[8px] font-semibold text-center leading-tight px-1 tracking-wide">
                                    {airport.length > 22 ? airport.substring(0, 20) + '…' : airport}
                                </span>
                            </div>
                        </div>

                        {/* Orbital bubbles */}
                        {DISPLAYS.map((d, i) => {
                            const { cx, cy } = orbPos(i, DISPLAYS.length);
                            return (
                                <a
                                    key={d.badge}
                                    href={d.href}
                                    className="absolute group"
                                    title={d.title}
                                    style={{
                                        left: cx - BUBBLE / 2,
                                        top:  cy - BUBBLE / 2,
                                        width: BUBBLE,
                                        height: BUBBLE,
                                        animation: `float-bubble ${3 + (i % 4) * 0.45}s ease-in-out infinite`,
                                        animationDelay: `${i * 0.38}s`,
                                    }}
                                >
                                    <div className={`
                                        w-full h-full rounded-full
                                        bg-white/85 backdrop-blur-sm
                                        ring-2 ring-white/50
                                        group-hover:ring-sky-300 group-hover:bg-white
                                        group-hover:scale-115
                                        transition-all duration-200
                                        shadow-lg group-hover:shadow-sky-300/40
                                        flex flex-col items-center justify-center gap-1
                                    `}
                                    style={{ '--tw-scale-x': 1, '--tw-scale-y': 1 } as React.CSSProperties}
                                    >
                                        <span className={d.ic}>{d.icon}</span>
                                        <span className="text-[10px] font-bold text-slate-700 text-center leading-tight px-2 group-hover:text-slate-900 transition-colors">
                                            {d.badge}
                                        </span>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* ── MOBILE GRID (< lg) ─────────────────────────────── */}
                <main className="lg:hidden relative z-10 flex-1 px-4 sm:px-6 py-6">
                    <p className="text-white/65 text-sm text-center mb-5">
                        Pilih layar monitor yang ingin ditampilkan
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                        {DISPLAYS.map((d) => (
                            <a
                                key={d.badge}
                                href={d.href}
                                className="group bg-white/85 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white hover:scale-105 transition-all shadow-md ring-1 ring-white/30 text-center"
                            >
                                <span className={d.ic}>{d.icon}</span>
                                <span className="text-xs font-bold text-slate-700 leading-tight">{d.badge}</span>
                                <span className="text-[10px] text-slate-500 leading-snug">{d.title}</span>
                            </a>
                        ))}
                    </div>

                    {/* Tips for mobile */}
                    <div className="mt-6 bg-white/15 backdrop-blur-sm rounded-2xl ring-1 ring-white/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Info size={14} className="text-sky-200 shrink-0" />
                            <span className="text-white/90 text-xs font-bold uppercase tracking-wider">Tips Operator</span>
                        </div>
                        <p className="text-white/60 text-xs leading-relaxed">
                            Tambahkan parameter <code className="bg-white/10 px-1 rounded text-sky-200">?id=gate-1</code> pada URL untuk menampilkan layar individual per area.
                        </p>
                    </div>
                </main>

                {/* ── FOOTER ─────────────────────────────────────────── */}
                <footer className="relative z-10 py-4 text-center border-t border-white/10">
                    <p className="text-white/30 text-[11px] tracking-widest uppercase">
                        &copy; {new Date().getFullYear()} {airport} — Flight Information Display System
                    </p>
                </footer>
            </div>
        </>
    );
}
