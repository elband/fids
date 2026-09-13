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
 * GERAKAN SENGAJA MINIMAL
 * Dulu papan menumpuk kilau melintas, ikon mengambang, baris memantul, tiap
 * huruf meluncur berurutan, dan teks status berdenyut di atas lampu kedip —
 * terlalu ramai untuk dibaca penumpang. Sekarang hanya gerakan yang membawa
 * informasi yang tersisa, semuanya tanpa pantulan:
 *   - baris & label kolom (ID/EN) muncul dengan fade singkat,
 *   - ubin flip + sorotan hanya pada status yang benar-benar berubah,
 *   - satu lampu kedip lembut untuk status kritis.
 */
export const BOARD_CSS = `
    @keyframes board-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
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
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.35; }
    }

    .header-col-wrap {
        overflow: hidden;
        display: block;
    }
    .header-col-text {
        display: inline-block;
        animation: board-fade-in 0.4s ease-out both;
    }
    .score-row {
        animation: board-fade-in 0.4s ease-out both;
        position: relative;
    }
    /* Baris dengan status baru: kilat latar + pita penanda di tepi kiri. */
    .score-row--changed {
        animation: board-fade-in 0.4s ease-out both,
                   row-flash 5s ease-out 0.4s both;
    }
    .score-row--changed::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 0.35vw;
        background: var(--row-marker, #facc15);
        box-shadow: 0 0 1vw var(--row-marker, #facc15);
    }
    .status-beacon {
        display: inline-block;
        width: 0.55vw;
        height: 0.55vw;
        border-radius: 9999px;
        margin-right: 0.45vw;
        vertical-align: middle;
        background: currentColor;
        animation: beacon-blink 2s ease-in-out infinite;
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
    /* Huruf diam saat baris sekadar dirender ulang/dirotasi; hanya flip (status
       yang benar-benar berubah) yang bergerak. */
    .score-char > span {
        position: relative;
        z-index: 1;
        display: inline-block;
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
    .fids-eco .status-beacon {
        animation: none;
    }
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
        .score-row,
        .score-row--changed,
        .header-col-text,
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
