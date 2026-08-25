interface Props {
    src: string;
    alt: string;
    /** Kelas tambahan untuk wadah (mis. rounded-* saat dipakai di dalam kartu). */
    className?: string;
}

/**
 * Gambar unggahan operator (mis. idle_image counter) ditampilkan UTUH.
 *
 * Sebelumnya layar memakai object-cover sehingga gambar dipotong di sisi
 * kanan/bawah — logo dan tulisan maskapai ikut terpangkas — padahal pratinjau
 * di halaman admin memakai object-contain, jadi operator mengunggah gambar
 * dengan asumsi tampil penuh. Sisa ruang diisi salinan gambar yang di-blur
 * agar layar tidak terlihat berpalang hitam pada rasio layar apa pun.
 */
export default function IdleImage({ src, alt, className = '' }: Props) {
    return (
        <div className={`absolute inset-0 overflow-hidden bg-black ${className}`}>
            <img
                src={src}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
            />
            <img
                src={src}
                alt={alt}
                draggable={false}
                className="relative h-full w-full object-contain"
            />
        </div>
    );
}
