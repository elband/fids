import { Link, usePage } from '@inertiajs/react';
import { PlaneTakeoff, PlaneLanding, ClipboardCheck, Building2, Luggage } from 'lucide-react';

export default function FidsSidebar() {
    const { url } = usePage();

    const menuItems = [
        {
            title: 'Keberangkatan',
            icon: <PlaneTakeoff size={20} />,
            href: '/public/flight/departure',
            active: url.startsWith('/public/flight/departure') || url.startsWith('/display/departure')
        },
        {
            title: 'Kedatangan',
            icon: <PlaneLanding size={20} />,
            href: '/public/flight/arrival',
            active: url.startsWith('/public/flight/arrival') || url.startsWith('/display/arrival')
        },
        {
            title: 'Checkin Counter',
            icon: <ClipboardCheck size={20} />,
            href: '/display/checkin-counter',
            active: url.startsWith('/display/checkin-counter') || url.startsWith('/public/gate/checkin')
        },
        {
            title: 'Boarding Gate',
            icon: <Building2 size={20} />,
            href: '/display/boarding-gate',
            active: url.startsWith('/display/boarding-gate') || url.startsWith('/public/gate/boarding')
        },
        {
            title: 'Baggage Claim',
            icon: <Luggage size={20} />,
            href: '/display/baggage-claim',
            active: url.startsWith('/display/baggage-claim') || url.startsWith('/public/gate/baggageclaim')
        },
    ];

    return (
        <div className="w-64 bg-gray-900 text-gray-300 min-h-screen flex flex-col shadow-xl">
            {/* Logo/Header */}
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-blue-500">FIDS</span> Display
                </h1>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                            item.active 
                                ? 'bg-gray-800 text-white shadow-sm' 
                                : 'hover:bg-gray-800/50 hover:text-white'
                        }`}
                    >
                        <span className={`${item.active ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'}`}>
                            {item.icon}
                        </span>
                        <span className="font-medium text-sm">
                            {item.title}
                        </span>
                    </Link>
                ))}
            </nav>
            
            {/* Footer / Info */}
            <div className="p-4 border-t border-gray-800">
                <div className="text-xs text-gray-500 text-center">
                    &copy; {new Date().getFullYear()} FIDS Management
                </div>
            </div>
        </div>
    );
}
