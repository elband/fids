import { ReactNode } from 'react';

interface Props {
    icon: ReactNode;
    eyebrow: string;
    title: string;
    description: string;
    gradient?: string;
    actions?: ReactNode;
    stats?: Array<{ label: string; value: ReactNode; icon?: ReactNode }>;
}

const DEFAULT_GRADIENT = 'from-fuchsia-600 via-purple-600 to-indigo-700';

export default function MasterHero({ icon, eyebrow, title, description, gradient = DEFAULT_GRADIENT, actions, stats }: Props) {
    return (
        <div className={`relative overflow-hidden rounded-3xl shadow-xl border border-white/10 bg-gradient-to-br ${gradient} text-white`}>
            <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-pink-300/30 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-violet-300/30 blur-3xl" />
            <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
                backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px',
            }} />

            <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 lg:p-8 items-center">
                <div className="lg:col-span-3 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 text-[11px] font-bold uppercase tracking-[0.2em]">
                        {icon}
                        {eyebrow}
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">{title}</h3>
                    <p className="text-sm lg:text-base text-white/85 max-w-2xl leading-relaxed">{description}</p>
                    {actions && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">{actions}</div>
                    )}
                </div>
                {stats && stats.length > 0 && (
                    <div className="lg:col-span-2 grid grid-cols-2 gap-3">
                        {stats.map((s, i) => (
                            <div key={i} className="rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20 px-4 py-3">
                                <div className="flex items-center gap-2 text-white/80 text-[10px] uppercase tracking-[0.2em] font-bold">
                                    {s.icon}
                                    {s.label}
                                </div>
                                <div className="mt-1 text-2xl font-black tabular-nums">{s.value}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
