export function hexToRgba(hex: string, alpha: number): string {
    let r = 0, g = 0, b = 0;
    if (hex && hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex && hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    } else {
        return `rgba(30, 58, 138, ${alpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export type Lang = 'id' | 'en';

export const t = {
    departures: { id: 'KEBERANGKATAN', en: 'DEPARTURES' },
    arrivals:   { id: 'KEDATANGAN',    en: 'ARRIVALS' },
    checkinCounters: { id: 'COUNTER CHECK-IN', en: 'CHECK-IN COUNTERS' },
    boardingGates:   { id: 'GATE KEBERANGKATAN', en: 'BOARDING GATES' },
    baggageClaim:    { id: 'PENGAMBILAN BAGASI', en: 'BAGGAGE CLAIM' },

    colAirline:     { id: 'Maskapai',     en: 'Airline' },
    colScheduled:   { id: 'Jadwal',       en: 'Sched.' },
    colFlight:      { id: 'Penerbangan',  en: 'Flight' },
    colDestination: { id: 'Tujuan',       en: 'Destination' },
    colArrivingFrom:{ id: 'Asal',         en: 'Arriving From' },
    colGate:        { id: 'Gate',         en: 'Gate' },
    colBaggage:     { id: 'Bagasi',       en: 'Baggage' },
    colStatus:      { id: 'Status',       en: 'Status' },

    loading:           { id: 'MEMUAT...', en: 'LOADING...' },
    noFlightsDep:      { id: 'TIDAK ADA JADWAL KEBERANGKATAN', en: 'NO SCHEDULED DEPARTURES' },
    noFlightsArr:      { id: 'TIDAK ADA JADWAL KEDATANGAN',    en: 'NO SCHEDULED ARRIVALS' },
    closed:            { id: 'TUTUP',              en: 'CLOSED' },
    openForCheckin:    { id: 'BUKA UNTUK CHECK-IN', en: 'OPEN FOR CHECK-IN' },
    noAssignedFlights: { id: 'TIDAK ADA PENERBANGAN', en: 'NO ASSIGNED FLIGHTS' },
    awaitingBaggage:   { id: 'MENUNGGU BAGASI', en: 'AWAITING BAGGAGE' },
    from:              { id: 'Dari: ',  en: 'From: ' },
    counter:           { id: 'Counter', en: 'Counter' },
    gate:              { id: 'Gate',    en: 'Gate' },
    belt:              { id: 'Belt',    en: 'Belt' },
    info:              { id: 'INFO',    en: 'INFO' },

    // Single display page labels
    checkinCounterLabel: { id: 'Check-in Counter',    en: 'Check-in Counter' },
    boardingGateLabel:   { id: 'Boarding Gate',       en: 'Boarding Gate' },
    baggageClaimBelt:    { id: 'Pengambilan Bagasi', en: 'Baggage Claim' },
    flightLabel:         { id: 'PENERBANGAN',         en: 'FLIGHT' },
    destinationLabel:    { id: 'TUJUAN',              en: 'DESTINATION' },
    arrivingFromLabel:   { id: 'KEDATANGAN DARI',     en: 'ARRIVING FROM' },
    checkinOpen:         { id: 'CHECK-IN\nTERBUKA',  en: 'CHECK-IN\nOPEN' },
    pleaseWait:          { id: 'HARAP\nTUNGGU',       en: 'PLEASE\nWAIT' },
    awaitingBaggageBig:  { id: 'MENUNGGU\nBAGASI',   en: 'AWAITING\nBAGGAGE' },
    proceedToCounter:    { id: 'SILAKAN MENUJU COUNTER', en: 'PLEASE PROCEED TO COUNTER' },
    collectLuggage:      { id: 'SILAKAN AMBIL BAGASI ANDA', en: 'PLEASE COLLECT YOUR LUGGAGE' },
    boardingSoon:        { id: 'SEGERA BOARDING',     en: 'BOARDING SOON' },
    weatherLabel:        { id: 'CUACA',               en: 'WEATHER' },
    tempLabel:           { id: 'SUHU',                en: 'TEMP' },
} as const satisfies Record<string, Record<Lang, string>>;
