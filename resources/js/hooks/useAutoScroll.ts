import { useEffect, useRef } from 'react';

export function useAutoScroll(speed = 1, pauseTime = 3000, deps: any[] = []) {
    const scrollRef = useRef<HTMLDivElement>(null);

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
    }, [speed, pauseTime, ...deps]);

    return scrollRef;
}
