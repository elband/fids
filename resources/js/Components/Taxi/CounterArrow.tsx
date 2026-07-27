import {
    ArrowDown, ArrowDownLeft, ArrowDownRight, ArrowLeft,
    ArrowRight, ArrowUp, ArrowUpLeft, ArrowUpRight, LucideIcon,
} from 'lucide-react';

/**
 * Panah arah counter digambar dengan ikon, bukan karakter Unicode.
 *
 * Glif panah Unicode tipis dan tebalnya mengikuti font — sebagian bahkan
 * dirender sebagai emoji berwarna. Ikon punya `strokeWidth` sendiri sehingga
 * ketebalannya bisa dipastikan dan tetap terbaca dari jauh.
 * Nilai yang tersimpan di basis data tetap berupa karakter panah.
 */
const ICONS: Record<string, LucideIcon> = {
    '→': ArrowRight,
    '←': ArrowLeft,
    '↑': ArrowUp,
    '↓': ArrowDown,
    '↗': ArrowUpRight,
    '↖': ArrowUpLeft,
    '↘': ArrowDownRight,
    '↙': ArrowDownLeft,
};

interface Props {
    arah: string;
    className?: string;
    /** Ketebalan garis; default sengaja tebal untuk layar jarak jauh. */
    strokeWidth?: number;
    style?: React.CSSProperties;
}

export default function CounterArrow({ arah, className, strokeWidth = 3.5, style }: Props) {
    const Icon = ICONS[arah] ?? ArrowRight;

    return <Icon className={className} strokeWidth={strokeWidth} style={style} />;
}
