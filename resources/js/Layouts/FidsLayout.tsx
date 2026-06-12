import { PropsWithChildren } from 'react';
import { Head } from '@inertiajs/react';

export default function FidsLayout({ children, title }: PropsWithChildren<{ title?: string }>) {
    return (
        <div className="flex min-h-screen bg-gray-900 font-sans text-gray-100">
            {title && <Head title={title} />}

            {/* Area Konten Utama */}
            <main className="flex-1 overflow-y-auto bg-gray-950">
                {children}
            </main>
        </div>
    );
}
