import { TaxiSettings } from './types';

/** Latar dasar per tema. Semuanya gelap — layar dipasang 24/7 di area publik. */
const THEMES: Record<TaxiSettings['tema_warna'], { base: string; glow: string }> = {
    slate:    { base: 'linear-gradient(150deg,#0b1120 0%,#111c33 55%,#0b1120 100%)', glow: 'rgba(56,189,248,0.14)' },
    midnight: { base: 'linear-gradient(150deg,#050813 0%,#0d1230 55%,#050813 100%)', glow: 'rgba(129,140,248,0.16)' },
    teal:     { base: 'linear-gradient(150deg,#04191c 0%,#062c30 55%,#04191c 100%)', glow: 'rgba(45,212,191,0.16)' },
    plum:     { base: 'linear-gradient(150deg,#150a1e 0%,#251035 55%,#150a1e 100%)', glow: 'rgba(232,121,249,0.16)' },
};

export function themeOf(tema: TaxiSettings['tema_warna']) {
    return THEMES[tema] ?? THEMES.slate;
}

/**
 * Warna status penerbangan. Kunci dicocokkan case-insensitive dan sebagian
 * dengan padanan Indonesianya karena data FIDS bisa memakai keduanya.
 */
const STATUS_STYLES: Record<string, StatusStyle> = {
    'boarding':     { text: '#34d399', bg: 'rgba(16,185,129,0.16)', ring: 'rgba(52,211,153,0.55)', pulse: true },
    'final call':   { text: '#fb7185', bg: 'rgba(244,63,94,0.18)',  ring: 'rgba(251,113,133,0.6)', pulse: true },
    'delayed':      { text: '#fbbf24', bg: 'rgba(245,158,11,0.16)', ring: 'rgba(251,191,36,0.5)' },
    'cancelled':    { text: '#f87171', bg: 'rgba(239,68,68,0.18)',  ring: 'rgba(248,113,113,0.55)' },
    'arrived':      { text: '#38bdf8', bg: 'rgba(14,165,233,0.16)', ring: 'rgba(56,189,248,0.5)' },
    'landed':       { text: '#22d3ee', bg: 'rgba(6,182,212,0.16)',  ring: 'rgba(34,211,238,0.5)' },
    'departed':     { text: '#a5b4fc', bg: 'rgba(99,102,241,0.16)', ring: 'rgba(165,180,252,0.45)' },
    'check-in open':{ text: '#5eead4', bg: 'rgba(20,184,166,0.16)', ring: 'rgba(94,234,212,0.45)' },
    'baggage claim':{ text: '#c4b5fd', bg: 'rgba(139,92,246,0.16)', ring: 'rgba(196,181,253,0.45)' },
    'on time':      { text: '#e2e8f0', bg: 'rgba(148,163,184,0.14)', ring: 'rgba(226,232,240,0.35)' },
    'scheduled':    { text: '#cbd5e1', bg: 'rgba(100,116,139,0.16)', ring: 'rgba(203,213,225,0.3)' },
};

type StatusStyle = { text: string; bg: string; ring: string; pulse?: boolean };

const DEFAULT_STATUS: StatusStyle = { text: '#e2e8f0', bg: 'rgba(148,163,184,0.14)', ring: 'rgba(226,232,240,0.3)' };

export function statusStyle(status: string | null | undefined): StatusStyle {
    if (!status) return DEFAULT_STATUS;
    return STATUS_STYLES[status.trim().toLowerCase()] ?? DEFAULT_STATUS;
}
