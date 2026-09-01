/**
 * Ubah berbagai bentuk URL YouTube menjadi URL embed autoplay.
 *
 * Dipakai HANYA oleh halaman CCTV (layar CCTV + admin CCTV Cameras).
 * Layar baggage claim sengaja memakai salinannya sendiri — dua halaman itu
 * terpisah dan tidak boleh saling mengunci lewat util bersama.
 *
 * Bentuk yang didukung: youtu.be/ID, /watch?v=ID, /embed/ID, /live/ID,
 * /shorts/ID, dan /v/ID. Bentuk selain embed ditolak YouTube lewat
 * X-Frame-Options, jadi operator yang menempel link Shorts / Live apa adanya
 * hanya melihat kotak hitam kalau tidak dikonversi di sini.
 *
 * URL non-YouTube (atau yang gagal diparse) dikembalikan apa adanya.
 */
export function youtubeEmbed(url: string): string {
    const embed = (id: string) =>
        `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1`;

    try {
        const u = new URL(url);

        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.split('/').filter(Boolean)[0];
            return id ? embed(id) : url;
        }

        if (u.hostname.includes('youtube.com')) {
            if (u.pathname.startsWith('/embed/')) return url;

            const v = u.searchParams.get('v');
            if (v) return embed(v);

            const [segment, id] = u.pathname.split('/').filter(Boolean);
            if (id && ['live', 'shorts', 'v'].includes(segment)) return embed(id);
        }
    } catch {
        /* URL tidak valid → biarkan pemanggil menampilkan apa adanya */
    }

    return url;
}
