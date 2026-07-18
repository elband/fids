import { useEffect, useRef } from 'react';

export function useAutoScroll(speed = 1, pauseTime = 3000, deps: any[] = []) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Pemanggil biasanya mengoper array segar tiap polling (mis. [flights]), yang
    // membuat referensinya berubah tiap ~10-15 dtk sehingga efek ini di-teardown &
    // di-restart terus (timeout 2 dtk + siklus pause-di-bawah ikut ter-reset, list
    // nyaris tak menggulir). Perubahan ukuran konten sudah ditangani ResizeObserver,
    // jadi efek cukup re-init saat JUMLAH item berubah — bukan tiap referensi baru.
    const depSignature = deps
        .map((d) => (Array.isArray(d) ? d.length : d))
        .join('|');

    useEffect(() => {
        const container = scrollRef.current;
        if (!container || speed <= 0) return;

        let animationFrameId: number;
        let isPaused = false;
        let pauseTimeoutId: any;
        let scrollAccumulator = 0;
        // Posisi & ukuran di-cache di luar loop rAF supaya tidak memaksa
        // reflow sinkron tiap frame (write lalu langsung read scrollTop/
        // scrollHeight setiap frame bikin patah-patah di GPU/CPU lemah,
        // misalnya chipset TV lawas).
        let position = container.scrollTop;
        let maxScroll = container.scrollHeight - container.clientHeight;

        const remeasure = () => {
            if (!container) return;
            maxScroll = container.scrollHeight - container.clientHeight;
        };

        const resizeObserver = new ResizeObserver(remeasure);
        resizeObserver.observe(container);

        const scroll = () => {
            if (!container) return;

            if (isPaused) {
                animationFrameId = requestAnimationFrame(scroll);
                return;
            }

            // Perform scroll based on speed
            scrollAccumulator += (speed * 0.5);

            if (scrollAccumulator >= 1) {
                const scrollAmount = Math.floor(scrollAccumulator);
                position += scrollAmount;
                container.scrollTop = position;
                scrollAccumulator -= scrollAmount;

                // Check if reached bottom (with 5px buffer)
                const isAtBottom = position >= maxScroll - 5;

                if (isAtBottom && maxScroll > 0) {
                    isPaused = true;

                    pauseTimeoutId = setTimeout(() => {
                        if (container) {
                            container.scrollTo({ top: 0, behavior: 'smooth' });
                            position = 0;
                        }

                        pauseTimeoutId = setTimeout(() => {
                            isPaused = false;
                        }, pauseTime);
                    }, pauseTime);
                }
            }

            animationFrameId = requestAnimationFrame(scroll);
        };

        pauseTimeoutId = setTimeout(() => {
            remeasure();
            animationFrameId = requestAnimationFrame(scroll);
        }, 2000);

        return () => {
            resizeObserver.disconnect();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (pauseTimeoutId) clearTimeout(pauseTimeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [speed, pauseTime, depSignature]);

    return scrollRef;
}
