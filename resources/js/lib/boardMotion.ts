/**
 * CSS papan keberangkatan & kedatangan — satu sumber untuk kedua layar.
 *
 * Sebelumnya blok <style> ini diduplikasi kata per kata di DepartureDisplay dan
 * ArrivalDisplay, sehingga tiap penambahan animasi langsung membuat keduanya
 * menyimpang. Semua keyframes papan sekarang tinggal di sini.
 *
 * MODE HEMAT (Raspberry Pi / perangkat lemah)
 * Root papan diberi kelas `fids-eco` saat setting `mode_hemat` aktif. Efek
 * mahal — animasi kontinu, blur, box-shadow bertumpuk, gradient ubin — dimatikan
 * lewat override di bawah, bukan lewat percabangan di JSX, supaya tidak ada
 * jalur animasi yang lolos karena terlupa dibungkus kondisi.
 *
 * Layar publik menyala 24/7: animasi yang berjalan terus-menerus (sweep, beacon)
 * dibatasi durasinya panjang dan jumlahnya sedikit agar GPU kios tidak panas.
 */
export const BOARD_CSS = `
    @keyframes score-slide-up {
        0%   { transform: translateY(100%); opacity: 0; }
        60%  { transform: translateY(-8%); opacity: 1; }
        80%  { transform: translateY(3%); }
        100% { transform: translateY(0%); opacity: 1; }
    }
    @keyframes score-row-in {
        0%   { transform: translateY(100%); opacity: 0; }
        50%  { transform: translateY(-3%); opacity: 1; }
        100% { transform: translateY(0); opacity: 1; }
    }
    @keyframes header-col-in {
        0%   { transform: translateY(110%); opacity: 0; }
        55%  { transform: translateY(-6%);  opacity: 1; }
        75%  { transform: translateY(2%); }
        100% { transform: translateY(0%);   opacity: 1; }
    }
    /* Split-flap sungguhan: ubin jatuh dari engsel atas seperti papan Solari. */
    @keyframes flap-in {
        0%   { transform: rotateX(-92deg); opacity: 0.2; }
        55%  { transform: rotateX(12deg);  opacity: 1; }
        78%  { transform: rotateX(-5deg); }
        100% { transform: rotateX(0deg);   opacity: 1; }
    }
    /* Sorotan baris yang statusnya baru berubah — menarik mata lalu tenang lagi. */
    @keyframes row-flash {
        0%   { background-color: rgba(250, 204, 21, 0.22); }
        70%  { background-color: rgba(250, 204, 21, 0.06); }
        100% { background-color: transparent; }
    }
    /* Lampu status kritis (Final Call / Boarding / Landed / Baggage Claim). */
    @keyframes beacon-blink {
        0%, 45%  { opacity: 1; transform: scale(1); }
        60%      { opacity: 0.25; transform: scale(0.72); }
        100%     { opacity: 1; transform: scale(1); }
    }
    /* Kilau lambat melintasi papan, meniru pantulan lampu bandara. */
    @keyframes board-sweep {
        0%   { transform: translateX(-30%); opacity: 0; }
        8%   { opacity: 1; }
        92%  { opacity: 1; }
        100% { transform: translateX(130%); opacity: 0; }
    }
    /* Ikon pesawat di header mengambang halus. */
    @keyframes head-float {
        0%, 100% { transform: translateY(0) translateX(0); }
        50%      { transform: translateY(-7%) translateX(2%); }
    }

    .header-col-wrap {
        overflow: hidden;
        display: block;
    }
    .header-col-text {
        display: inline-block;
        animation: header-col-in 0.55s cubic-bezier(0.16, 0.84, 0.44, 1) both;
    }
    .score-row {
        animation: score-row-in 0.6s cubic-bezier(0.16, 0.84, 0.44, 1) both;
        transform-origin: bottom center;
        position: relative;
    }
    /* Baris dengan status baru: kilat latar + pita penanda di tepi kiri. */
    .score-row--changed {
        animation: score-row-in 0.6s cubic-bezier(0.16, 0.84, 0.44, 1) both,
                   row-flash 5s ease-out 0.6s both;
    }
    .score-row--changed::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 0.35vw;
        background: var(--row-marker, #facc15);
        box-shadow: 0 0 1vw var(--row-marker, #facc15);
    }
    .board-sweep {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 3;
        background: linear-gradient(105deg,
            transparent 0%,
            rgba(255,255,255,0.045) 45%,
            rgba(255,255,255,0.10) 50%,
            rgba(255,255,255,0.045) 55%,
            transparent 100%);
        width: 26%;
        animation: board-sweep 14s linear infinite;
    }
    .head-float {
        animation: head-float 5.5s ease-in-out infinite;
    }
    .status-beacon {
        display: inline-block;
        width: 0.55vw;
        height: 0.55vw;
        border-radius: 9999px;
        margin-right: 0.45vw;
        vertical-align: middle;
        background: currentColor;
        box-shadow: 0 0 0.6vw currentColor;
        animation: beacon-blink 1.4s ease-in-out infinite;
    }
    /* Ubin split-flap (Solari): ubin gelap, belahan atas/bawah, seam melintang. */
    .score-char {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        min-width: 0.62em;
        height: 1.3em;
        margin: 0 0.75px;
        background: var(--score-slot-bg, rgba(0,0,0,0.28));
        border-radius: 2px;
        border: 1px solid var(--score-slot-border, rgba(0,0,0,0.55));
        box-shadow: 0 1px 1px rgba(0,0,0,0.25);
        position: relative;
        perspective: 60px;
    }
    .score-char::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom,
            var(--flap-top, rgba(255,255,255,0.06)) 0%,
            var(--flap-top, rgba(255,255,255,0.06)) 49.3%,
            var(--flap-bottom, rgba(0,0,0,0.3)) 50.7%,
            var(--flap-bottom, rgba(0,0,0,0.3)) 100%);
        pointer-events: none;
        z-index: 0;
    }
    .score-char::after {
        content: '';
        position: absolute;
        left: 0; right: 0;
        top: 50%;
        height: 1px;
        transform: translateY(-0.5px);
        background: var(--score-seam, rgba(0,0,0,0.7));
        z-index: 2;
    }
    .score-char > span {
        position: relative;
        z-index: 1;
        display: inline-block;
        animation: score-slide-up 0.4s cubic-bezier(0.16, 0.84, 0.44, 1) both;
    }
    .score-char > span.score-char-flip {
        transform-origin: center top;
        animation: flap-in 0.45s cubic-bezier(0.3, 1.2, 0.5, 1) both;
    }
    /* Font monospace gaya papan bandara (Solari/split-flap) untuk isi tabel. */
    .board-font, .board-font * {
        font-family: ui-monospace, 'Cascadia Mono', 'Consolas', 'DejaVu Sans Mono', 'Menlo', 'Courier New', monospace;
        letter-spacing: 0.02em;
    }

    /* Batang gulir disembunyikan: papan publik digulirkan sendiri oleh sistem. */
    .board-scroll {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .board-scroll::-webkit-scrollbar { display: none; }

    /* ---- Mode hemat: buang yang berjalan terus & yang mahal digambar ---- */
    .fids-eco .board-sweep,
    .fids-eco .head-float,
    .fids-eco .status-beacon {
        animation: none;
    }
    .fids-eco .board-sweep { display: none; }
    .fids-eco .status-beacon { box-shadow: none; }
    .fids-eco .score-row--changed {
        animation: row-flash 5s ease-out both;
    }
    .fids-eco .score-row--changed::before { box-shadow: none; }
    .fids-eco .score-char {
        box-shadow: none;
        perspective: none;
    }
    .fids-eco .score-char::before { display: none; }
    .fids-eco .score-char > span,
    .fids-eco .score-char > span.score-char-flip {
        animation: none;
        transform: none;
        opacity: 1;
    }
    .fids-eco .score-row { animation: none; }
    .fids-eco .header-col-text { animation: none; }
    .fids-eco .drop-shadow,
    .fids-eco .drop-shadow-lg,
    .fids-eco .drop-shadow-sm { filter: none; }

    /* Hormati preferensi sistem kios yang dikonfigurasi anti-animasi. */
    @media (prefers-reduced-motion: reduce) {
        .board-sweep { display: none; }
        .score-row,
        .score-row--changed,
        .header-col-text,
        .head-float,
        .status-beacon,
        .score-char > span,
        .score-char > span.score-char-flip {
            animation: none;
            transform: none;
            opacity: 1;
        }
    }
`;

/** Status yang perlu perhatian penumpang sekarang juga — diberi lampu berkedip. */
export const URGENT_DEPARTURE_STATUSES = ['Boarding', 'Final Call', 'Gate Open'];
export const URGENT_ARRIVAL_STATUSES = ['Landed', 'Baggage Claim'];
