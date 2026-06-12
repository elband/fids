import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect, useRef } from 'react';
import { announce } from '@/lib/announcer';
import ToastViewport from '@/Components/Toast';
import {
    LayoutDashboard,
    Database,
    Monitor,
    ChevronDown,
    Menu,
    Plane,
    PlaneTakeoff,
    PlaneLanding,
    Map,
    MapPin,
    Hash,
    DoorOpen,
    Keyboard,
    Briefcase,
    AlertCircle,
    User,
    Users,
    LogOut,
    Settings,
    Tv,
    VolumeX,
    Radio,
    Sun,
    Moon,
    Camera,
    FileBarChart2,
    Globe,
} from 'lucide-react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { url, props } = usePage();
    const user = props.auth.user;
    const roles = props.auth.roles as string[];
    const isSuperAdmin = roles?.includes('Super Admin');
    const logoBandara = props.logoBandara as string | null;

    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains('dark')
    );

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('fids-theme', next ? 'dark' : 'light');
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDataMasterExpanded, setIsDataMasterExpanded] = useState(
        url.startsWith('/admin/airlines') || 
        url.startsWith('/admin/flights') || 
        url.startsWith('/admin/airports') || 
        url.startsWith('/admin/routes') || 
        url.startsWith('/admin/gates') || 
        url.startsWith('/admin/checkin-counters') || 
        url.startsWith('/admin/baggage-claims') || 
        url.startsWith('/admin/airplanes') || 
        url.startsWith('/admin/remarks') || 
        url.startsWith('/admin/reasons') || 
        url.startsWith('/admin/departures') || 
        url.startsWith('/admin/arrivals')
    );
    const [isReportExpanded, setIsReportExpanded] = useState(
        url.startsWith('/admin/reports')
    );

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleDataMaster = () => setIsDataMasterExpanded(!isDataMasterExpanded);
    const toggleReport = () => setIsReportExpanded(!isReportExpanded);

    // Sidebar items definition
    const sidebarItems = [
        {
            name: 'Dashboard',
            icon: <LayoutDashboard size={20} />,
            href: route('admin.dashboard'),
            active: route().current('admin.dashboard'),
        },
        {
            name: 'Keberangkatan (Hari Ini)',
            icon: <PlaneTakeoff size={20} />,
            href: route('admin.daily-departures.index'),
            active: route().current('admin.daily-departures.*'),
        },
        {
            name: 'Kedatangan (Hari Ini)',
            icon: <PlaneLanding size={20} />,
            href: route('admin.daily-arrivals.index'),
            active: route().current('admin.daily-arrivals.*'),
        },
        {
            name: 'Boarding Gate',
            icon: <DoorOpen size={20} />,
            href: route('admin.gates.index'),
            active: route().current('admin.gates.*'),
        },
        {
            name: 'Checkin Counter',
            icon: <Keyboard size={20} />,
            href: route('admin.checkin-counters.index'),
            active: route().current('admin.checkin-counters.*'),
        },
        {
            name: 'Baggage Claim',
            icon: <Briefcase size={20} />,
            href: route('admin.baggage-claims.index'),
            active: route().current('admin.baggage-claims.*'),
        },
        {
            name: 'Pengaturan TV Layar Publik',
            icon: <Monitor size={20} />,
            href: route('admin.public-screen-settings.index'),
            active: route().current('admin.public-screen-settings.*'),
        },
        {
            name: 'World Clock Display',
            icon: <Globe size={20} />,
            href: route('admin.world-clock-settings.index'),
            active: route().current('admin.world-clock-settings.*'),
        },
        {
            name: 'Advertisement Management',
            icon: <Tv size={20} />,
            href: route('admin.advertisements.index'),
            active: route().current('admin.advertisements.*'),
        },
        {
            name: 'CCTV Cameras',
            icon: <Camera size={20} />,
            href: route('admin.cctv-cameras.index'),
            active: route().current('admin.cctv-cameras.*'),
        },
        {
            name: 'Public Announcement',
            icon: <AlertCircle size={20} />,
            href: route('admin.public-announcements.index'),
            active: route().current('admin.public-announcements.*'),
        },
        ...(isSuperAdmin ? [{
            name: 'Manajemen User',
            icon: <Users size={20} />,
            href: route('admin.users.index'),
            active: route().current('admin.users.*'),
        }] : []),
    ];

    const dataMasterItems = [
        { name: 'Maskapai', icon: <Plane size={18} />, href: route('admin.airlines.index'), active: route().current('admin.airlines.*') },
        { name: 'Pesawat', icon: <Plane size={18} />, href: route('admin.airplanes.index'), active: route().current('admin.airplanes.*') },
        { name: 'Rute', icon: <Map size={18} />, href: route('admin.routes.index'), active: route().current('admin.routes.*') },
        { name: 'Master Keberangkatan', icon: <PlaneTakeoff size={18} />, href: route('admin.departures.index'), active: route().current('admin.departures.*') },
        { name: 'Master Kedatangan', icon: <PlaneLanding size={18} />, href: route('admin.arrivals.index'), active: route().current('admin.arrivals.*') },
        { name: 'Bandara', icon: <MapPin size={18} />, href: route('admin.airports.index'), active: route().current('admin.airports.*') },
        { name: 'Remark', icon: <Hash size={18} />, href: route('admin.remarks.index'), active: route().current('admin.remarks.*') },
        { name: 'Reason', icon: <AlertCircle size={18} />, href: route('admin.reasons.index'), active: route().current('admin.reasons.*') },
    ];

    const reportItems = [
        { name: 'Keberangkatan', icon: <PlaneTakeoff size={18} />, href: route('admin.reports.departures'), active: route().current('admin.reports.departures*') },
        { name: 'Kedatangan', icon: <PlaneLanding size={18} />, href: route('admin.reports.arrivals'), active: route().current('admin.reports.arrivals*') },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
            {/* Sidebar Mobile & Desktop */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-center px-4 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0 min-h-[5rem]">
                        <Link href="/" className="flex flex-col items-center gap-1">
                            <ApplicationLogo logoUrl={logoBandara} className="h-14 w-auto fill-current text-blue-600" />
                            {!logoBandara && (
                                <span className="text-sm font-bold text-gray-800 dark:text-white tracking-wider">FIDS Admin</span>
                            )}
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1 custom-scrollbar">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    item.active 
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                                }`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        ))}

                        {/* Data Master Collapsible */}
                        <div>
                            <button
                                onClick={toggleDataMaster}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isDataMasterExpanded 
                                        ? 'text-gray-900 dark:text-white' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Database size={20} />
                                    <span>Data Master</span>
                                </div>
                                <ChevronDown 
                                    size={16} 
                                    className={`transform transition-transform duration-200 ${isDataMasterExpanded ? 'rotate-180' : ''}`} 
                                />
                            </button>

                            {isDataMasterExpanded && (
                                <div className="mt-1 ml-4 space-y-1 border-l border-gray-200 dark:border-gray-700">
                                    {dataMasterItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                item.active 
                                                    ? 'text-blue-700 dark:text-blue-400' 
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <span className="opacity-70">{item.icon}</span>
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Report Collapsible */}
                        <div>
                            <button
                                onClick={toggleReport}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isReportExpanded
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FileBarChart2 size={20} />
                                    <span>Report</span>
                                </div>
                                <ChevronDown
                                    size={16}
                                    className={`transform transition-transform duration-200 ${isReportExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isReportExpanded && (
                                <div className="mt-1 ml-4 space-y-1 border-l border-gray-200 dark:border-gray-700">
                                    {reportItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                item.active
                                                    ? 'text-blue-700 dark:text-blue-400'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <span className="opacity-70">{item.icon}</span>
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </nav>


                    {/* Sidebar Footer / User Info */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400">
                                <User size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            {/* Theme toggle */}
                            <button
                                onClick={toggleTheme}
                                title={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1
                                    text-gray-600 dark:text-gray-400
                                    hover:bg-gray-100 dark:hover:bg-gray-700/50"
                            >
                                {isDark
                                    ? <Sun size={18} className="text-yellow-400" />
                                    : <Moon size={18} className="text-indigo-500" />
                                }
                                <span>{isDark ? 'Terang' : 'Gelap'}</span>
                            </button>

                            {/* Logout */}
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                title="Log Out"
                                className="flex items-center justify-center p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750 lg:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        {header && (
                            <div className="hidden lg:block">
                                {header}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <VoiceMonitor />
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750">
                                    <Settings size={20} />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" width="48">
                                <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                <Dropdown.Link href={route('admin.display-settings.index')}>Pengaturan Layar FIDS</Dropdown.Link>
                                <Dropdown.Link href={route('admin.ntp-settings.index')}>Pengaturan NTP Server</Dropdown.Link>
                                <hr className="border-gray-200 dark:border-gray-700 my-1" />
                                <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    {/* Mobile Header Title */}
                    <div className="lg:hidden p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        {header}
                    </div>
                    
                    <div className="py-6">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
            <ToastViewport />
        </div>
    );
}
const VoiceMonitor = () => {
    const [audioEnabled, setAudioEnabled] = useState(() => {
        return localStorage.getItem('fids_pas_monitor') === 'true';
    });
    
    const [pending, setPending] = useState<any[]>([]);
    const isPlayingRef = useRef(false);
    const playedIdsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        localStorage.setItem('fids_pas_monitor', audioEnabled.toString());
        if (audioEnabled) {
            // PAS Monitor enabled
        } else {
            // stop any in-flight speech when user disables
            try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
            isPlayingRef.current = false;
        }
    }, [audioEnabled]);

    const fetchPending = async () => {
        if (!audioEnabled) return;
        try {
            const res = await fetch(route('api.pending-announcements'));
            const data = await res.json();
            setPending(data);
        } catch (e) {
            // silent fail for polling
        }
    };

    useEffect(() => {
        const timer = setInterval(fetchPending, 10000);
        fetchPending();
        return () => clearInterval(timer);
    }, [audioEnabled]);

    useEffect(() => {
        if (!audioEnabled || isPlayingRef.current) return;
        // Pick first pending that wasn't played in this session
        const ann = pending.find((a) => !playedIdsRef.current.has(a.id));
        if (!ann) return;

        isPlayingRef.current = true;
        playedIdsRef.current.add(ann.id);

        const text = String(ann.isi_pengumuman ?? '').replace(/---/g, '. ');
        announce(text, { lang: 'id-ID', rate: 0.92 })
            .then(() => {
                return fetch(route('admin.public-announcements.increment-count', ann.id), {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                });
            })
            .then(() => { /* count incremented */ })
            .catch(() => { /* silent */ })
            .finally(() => {
                isPlayingRef.current = false;
                // refresh pending list so finished announcement disappears
                fetchPending();
            });
    }, [pending, audioEnabled]);

    return (
        <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                audioEnabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm' 
                    : 'bg-red-500/10 text-red-600 border-red-500/20'
            }`}
            title={audioEnabled ? 'Voice Monitor Active' : 'Voice Monitor Muted'}
        >
            {audioEnabled ? (
                <>
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <Radio size={14} className="animate-pulse" />
                    <span>PAS MONITOR ON</span>
                </>
            ) : (
                <>
                    <VolumeX size={14} />
                    <span>PAS MONITOR OFF</span>
                </>
            )}
        </button>
    );
};

