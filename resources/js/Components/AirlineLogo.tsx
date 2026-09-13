import { useEffect, useState } from 'react';

// Reuse the normalized image across rows and flight-board page changes.
const normalizedLogos = new Map<string, Promise<string>>();

function normalizeLogo(src: string): Promise<string> {
    const cached = normalizedLogos.get(src);
    if (cached) return cached;
    const result = new Promise<string>(resolve => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onerror = () => resolve(src);
        image.onload = () => {
            try {
                const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
                canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
                const context = canvas.getContext('2d');
                if (!context) return resolve(src);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
                let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        // Ignore transparent and near-white outer space on a white logo plate.
                        if (data[i + 3] < 32 || (data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245)) continue;
                        left = Math.min(left, x);
                        top = Math.min(top, y);
                        right = Math.max(right, x);
                        bottom = Math.max(bottom, y);
                    }
                }
                if (right < left || bottom < top) return resolve(src);
                left = Math.max(0, left - 2);
                top = Math.max(0, top - 2);
                right = Math.min(canvas.width - 1, right + 2);
                bottom = Math.min(canvas.height - 1, bottom + 2);
                const cropped = document.createElement('canvas');
                cropped.width = right - left + 1;
                cropped.height = bottom - top + 1;
                const output = cropped.getContext('2d');
                if (!output) return resolve(src);
                output.drawImage(canvas, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
                resolve(cropped.toDataURL('image/png'));
            } catch {
                // External images without CORS support still render normally.
                resolve(src);
            }
        };
        image.src = src;
    });
    normalizedLogos.set(src, result);
    return result;
}

export default function AirlineLogo({ src, name }: { src: string; name: string }) {
    const [normalized, setNormalized] = useState({ source: src, url: src });
    useEffect(() => {
        let active = true;
        normalizeLogo(src).then(url => {
            if (active) setNormalized({ source: src, url });
        });
        return () => { active = false; };
    }, [src]);

    return <img src={normalized.source === src ? normalized.url : src} alt={name}
        className="h-full w-full object-contain" />;
}
