/**
 * Input waktu format 24 jam yang konsisten di semua perangkat/locale.
 * Tidak memakai <input type="time"> native (formatnya 12/24 jam mengikuti
 * locale OS sehingga bisa muncul AM/PM). Menggunakan dropdown jam (00-23) &
 * menit (00-59). Nilai tetap berupa string "HH:MM" (atau "" bila kosong),
 * sehingga kompatibel dengan field jam_jadwal/jam_estimasi/jam_aktual.
 */
export default function TimeInput24({
    value,
    onChange,
    required = false,
    className = '',
}: {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    className?: string;
}) {
    const [hh = '', mm = ''] = (value || '').split(':');

    const emit = (h: string, m: string) => {
        if (!h && !m) {
            onChange('');
        } else {
            onChange(`${(h || '00').padStart(2, '0')}:${(m || '00').padStart(2, '0')}`);
        }
    };

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const selectCls =
        'min-w-0 flex-1 appearance-none border-0 bg-transparent text-center tabular-nums focus:outline-none dark:text-white cursor-pointer';

    return (
        <div
            className={`flex items-center justify-center gap-0.5 ${className}`}
            role="group"
            aria-label="Waktu 24 jam"
        >
            <select
                value={hh}
                onChange={(e) => emit(e.target.value, mm)}
                required={required}
                className={selectCls}
                aria-label="Jam"
            >
                <option value="">--</option>
                {hours.map((h) => (
                    <option key={h} value={h}>{h}</option>
                ))}
            </select>
            <span className="font-bold text-gray-400 shrink-0">:</span>
            <select
                value={mm}
                onChange={(e) => emit(hh, e.target.value)}
                required={required}
                className={selectCls}
                aria-label="Menit"
            >
                <option value="">--</option>
                {minutes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                ))}
            </select>
        </div>
    );
}
