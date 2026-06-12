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
                container.scrollTop += scrollAmount;
                scrollAccumulator -= scrollAmount;

                // Check if reached bottom (with 5px buffer)
                const isAtBottom = Math.ceil(container.scrollTop + container.clientHeight) >= container.scrollHeight - 5;

                if (isAtBottom && container.scrollHeight > container.clientHeight) {
                    isPaused = true;
                    
                    pauseTimeoutId = setTimeout(() => {
                        if (container) {
                            container.scrollTo({ top: 0, behavior: 'smooth' });
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
            animationFrameId = requestAnimationFrame(scroll);
        }, 2000);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (pauseTimeoutId) clearTimeout(pauseTimeoutId);
        };
    }, [speed, pauseTime, ...deps]);

    return scrollRef;
}
