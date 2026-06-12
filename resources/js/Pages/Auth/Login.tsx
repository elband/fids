import { useState, useEffect, FormEventHandler } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Eye, EyeOff, Lock, Mail, Plane, Radio } from 'lucide-react';

const CSS = `
  @keyframes radar-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes radar-spin-rev {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes ring-pulse {
    0%, 100% { opacity: 0.07; }
    50%       { opacity: 0.18; }
  }
  @keyframes blip-glow {
    0%, 100% { opacity: 0; transform: scale(0.4); }
    40%, 60% { opacity: 1;  transform: scale(1);   }
  }
  @keyframes fly-1 {
    0%   { transform: translate(-60px, 0) rotate(-38deg); opacity: 0; }
    6%   { opacity: 0.65; }
    94%  { opacity: 0.65; }
    100% { transform: translate(110vw, -58vh) rotate(-38deg); opacity: 0; }
  }
  @keyframes fly-2 {
    0%   { transform: translate(-60px, 0) rotate(-22deg); opacity: 0; }
    6%   { opacity: 0.4; }
    94%  { opacity: 0.4; }
    100% { transform: translate(110vw, -32vh) rotate(-22deg); opacity: 0; }
  }
  @keyframes fly-3 {
    0%   { transform: translate(-60px, 0) rotate(-50deg); opacity: 0; }
    6%   { opacity: 0.25; }
    94%  { opacity: 0.25; }
    100% { transform: translate(95vw, -78vh) rotate(-50deg); opacity: 0; }
  }
  @keyframes grid-move {
    from { background-position: 0 0; }
    to   { background-position: 40px 40px; }
  }
`;

const RADAR_RINGS   = [120, 210, 300, 390, 480];
const BLIPS = [
  { x: '58%', y: '36%', delay: '1.1s', dur: '3.8s' },
  { x: '42%', y: '27%', delay: '2.9s', dur: '4.2s' },
  { x: '68%', y: '52%', delay: '0.4s', dur: '3.5s' },
  { x: '33%', y: '63%', delay: '3.6s', dur: '4.8s' },
  { x: '55%', y: '70%', delay: '1.8s', dur: '3.2s' },
];

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const logoBandara = usePage().props.logoBandara as string | null;
    const [showPassword, setShowPassword] = useState(false);
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    const timeStr = clock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = clock.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden select-none"
            style={{ background: 'linear-gradient(145deg,#050d1c 0%,#091628 55%,#050d1c 100%)' }}>

            <Head title="Login — FIDS" />
            <style>{CSS}</style>

            {/* ── MOVING GRID ─────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #60a5fa 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    animation: 'grid-move 8s linear infinite',
                }} />

            {/* ── RADAR MAIN (bottom-right) ────────────── */}
            <div className="absolute pointer-events-none"
                style={{ width: 640, height: 640, bottom: -120, right: -120 }}>

                {RADAR_RINGS.map((d, i) => (
                    <div key={i} className="absolute rounded-full border border-green-400"
                        style={{
                            width: d, height: d,
                            top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)',
                            animation: `ring-pulse ${2.2 + i * 0.35}s ease-in-out infinite`,
                            animationDelay: `${i * 0.28}s`,
                        }} />
                ))}

                {/* Cross lines */}
                <div className="absolute bg-green-400/5"
                    style={{ width: 480, height: 1, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                <div className="absolute bg-green-400/5"
                    style={{ width: 1, height: 480, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

                {/* Sweep */}
                <div className="absolute rounded-full"
                    style={{
                        width: 480, height: 480,
                        top: '50%', left: '50%',
                        transform: 'translate(-50%,-50%)',
                        background: 'conic-gradient(transparent 0%,transparent 80%,rgba(34,197,94,0.06) 88%,rgba(34,197,94,0.35) 100%)',
                        animation: 'radar-spin 3.6s linear infinite',
                    }} />

                {/* Center dot */}
                <div className="absolute w-2 h-2 rounded-full bg-green-400"
                    style={{
                        top: '50%', left: '50%',
                        transform: 'translate(-50%,-50%)',
                        boxShadow: '0 0 10px 4px rgba(34,197,94,0.6)',
                    }} />

                {/* Blips */}
                {BLIPS.map((b, i) => (
                    <div key={i} className="absolute w-2 h-2 rounded-full bg-green-400"
                        style={{
                            left: b.x, top: b.y,
                            boxShadow: '0 0 8px 3px rgba(34,197,94,0.7)',
                            animation: `blip-glow ${b.dur} ease-in-out infinite`,
                            animationDelay: b.delay,
                        }} />
                ))}
            </div>

            {/* ── RADAR MINI (top-left) ─────────────────── */}
            <div className="absolute pointer-events-none opacity-40"
                style={{ width: 340, height: 340, top: -80, left: -80 }}>
                {[80, 140, 200, 260].map((d, i) => (
                    <div key={i} className="absolute rounded-full border border-blue-400/20"
                        style={{ width: d, height: d, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                ))}
                <div className="absolute rounded-full"
                    style={{
                        width: 260, height: 260,
                        top: '50%', left: '50%',
                        transform: 'translate(-50%,-50%)',
                        background: 'conic-gradient(transparent 0%,transparent 78%,rgba(59,130,246,0.05) 88%,rgba(59,130,246,0.25) 100%)',
                        animation: 'radar-spin-rev 5s linear infinite',
                    }} />
            </div>

            {/* ── FLYING PLANES ─────────────────────────── */}
            <div className="absolute bottom-1/4 left-0 pointer-events-none text-blue-300"
                style={{ animation: 'fly-1 13s linear infinite' }}>
                <Plane size={26} />
            </div>
            <div className="absolute bottom-1/3 left-0 pointer-events-none text-blue-200"
                style={{ animation: 'fly-2 21s linear infinite', animationDelay: '4s' }}>
                <Plane size={18} />
            </div>
            <div className="absolute bottom-2/3 left-0 pointer-events-none text-blue-200"
                style={{ animation: 'fly-3 29s linear infinite', animationDelay: '10s' }}>
                <Plane size={14} />
            </div>

            {/* ── LOGIN CARD ─────────────────────────────── */}
            <div className="relative z-10 w-full max-w-md mx-4">

                <div className="rounded-2xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(160deg, rgba(30,10,50,0.82) 0%, rgba(50,10,40,0.88) 100%)',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(236,72,153,0.3), 0 0 0 1px rgba(139,92,246,0.25)',
                        backdropFilter: 'blur(32px)',
                    }}>

                    {/* Top accent bar */}
                    <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#ec4899,#a855f7,#ec4899)' }} />

                    <div className="px-8 py-9">
                        {/* Logo */}
                        <div className="flex justify-center mb-5">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
                                    style={{ background: 'radial-gradient(circle,#ec4899,#a855f7)' }} />
                                <ApplicationLogo logoUrl={logoBandara} className="relative h-28 w-auto drop-shadow-2xl" />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-24 h-px mx-auto mb-5"
                            style={{ background: 'linear-gradient(90deg,transparent,rgba(236,72,153,0.5),transparent)' }} />

                        {/* Heading */}
                        <div className="text-center mb-7">
                            <h2 className="text-2xl font-bold text-white tracking-wide">Selamat Datang</h2>
                            <p className="text-pink-300/70 text-sm mt-1.5 tracking-wide">Masuk ke panel administrator FIDS</p>
                        </div>

                        {/* Status */}
                        {status && (
                            <div className="mb-5 flex items-center gap-2 p-3.5 rounded-xl text-sm text-green-300 border border-green-500/30"
                                style={{ background: 'rgba(34,197,94,0.1)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-xs font-semibold text-pink-300/80 uppercase tracking-widest mb-2">
                                    Email
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={16} className="text-purple-400/60 group-focus-within:text-pink-400 transition-colors" />
                                    </div>
                                    <input
                                        id="email" type="email" name="email"
                                        value={data.email} autoComplete="username" autoFocus
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="admin@example.com"
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none transition-all"
                                        style={{
                                            background: 'rgba(255,255,255,0.07)',
                                            border: '1px solid rgba(168,85,247,0.3)',
                                        }}
                                        onFocus={e => e.currentTarget.style.border = '1px solid rgba(236,72,153,0.6)'}
                                        onBlur={e => e.currentTarget.style.border = '1px solid rgba(168,85,247,0.3)'}
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1.5 text-xs text-pink-400" />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-xs font-semibold text-pink-300/80 uppercase tracking-widest mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={16} className="text-purple-400/60 group-focus-within:text-pink-400 transition-colors" />
                                    </div>
                                    <input
                                        id="password" type={showPassword ? 'text' : 'password'} name="password"
                                        value={data.password} autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-12 py-3.5 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none transition-all"
                                        style={{
                                            background: 'rgba(255,255,255,0.07)',
                                            border: '1px solid rgba(168,85,247,0.3)',
                                        }}
                                        onFocus={e => e.currentTarget.style.border = '1px solid rgba(236,72,153,0.6)'}
                                        onBlur={e => e.currentTarget.style.border = '1px solid rgba(168,85,247,0.3)'}
                                    />
                                    <button type="button" tabIndex={-1}
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-400/50 hover:text-pink-300 transition-colors">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-1.5 text-xs text-pink-400" />
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <div className="relative w-4 h-4 shrink-0">
                                        <input type="checkbox" name="remember" checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked as false)}
                                            className="peer w-4 h-4 rounded appearance-none border border-purple-500/40 bg-white/5 checked:bg-pink-500 checked:border-pink-500 transition-all focus:ring-0 focus:ring-offset-0 cursor-pointer" />
                                        <svg className="absolute inset-0 w-4 h-4 pointer-events-none hidden peer-checked:block text-white" viewBox="0 0 16 16" fill="none">
                                            <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors">Ingat saya</span>
                                </label>
                                {canResetPassword && (
                                    <Link href={route('password.request')}
                                        className="text-sm font-semibold text-pink-400 hover:text-pink-300 transition-colors">
                                        Lupa password?
                                    </Link>
                                )}
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={processing}
                                className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-60 active:scale-[0.98] hover:brightness-110"
                                style={{
                                    background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                                    boxShadow: '0 6px 24px rgba(236,72,153,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                                }}>
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <Plane size={15} style={{ transform: 'rotate(-45deg)' }} />
                                        Masuk
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-7 pt-5 text-center"
                            style={{ borderTop: '1px solid rgba(168,85,247,0.15)' }}>
                            <p className="text-xs text-white/25">
                                &copy; {new Date().getFullYear()} FIDS — Flight Information Display System
                            </p>
                        </div>
                    </div>
                </div>

                {/* Clock below card */}
                <div className="text-center mt-5 space-y-0.5">
                    <div className="flex items-center justify-center gap-2">
                        <Radio size={11} className="text-green-400 animate-pulse" />
                        <span className="text-green-400 text-[11px] font-semibold tracking-widest uppercase">Live</span>
                    </div>
                    <div className="font-mono text-3xl font-bold text-white/80 tracking-widest tabular-nums">
                        {timeStr}
                    </div>
                    <div className="text-blue-300/50 text-xs capitalize">{dateStr}</div>
                </div>
            </div>
        </div>
    );
}
