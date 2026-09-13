function playAutomatically(video: HTMLVideoElement) {
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.loop = true;
    video.controls = false;
    void video.play().catch(() => { /* Retry when media becomes playable. */ });
}

/** Direct video files need a sized player instead of the browser's media document. */
export default function CameraEmbed({ src, title }: { src: string; title: string }) {
    let directVideo = false;
    try {
        directVideo = /\.(mp4|webm|ogv|ogg|m4v|mov)$/i.test(new URL(src, window.location.href).pathname);
    } catch { /* Let the iframe handle other embed URLs. */ }

    if (directVideo) {
        return <video key={src} src={src} aria-label={title} autoPlay muted loop playsInline
            onCanPlay={event => playAutomatically(event.currentTarget)}
            className="block h-full w-full object-cover bg-black" />;
    }

    return <iframe src={src} title={title} className="block w-full h-full border-0 bg-black"
        allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
        onLoad={event => {
            try {
                const doc = event.currentTarget.contentDocument;
                if (!doc?.querySelector('video')) return;
                const style = doc.createElement('style');
                style.textContent = 'html,body{width:100%!important;height:100%!important;margin:0!important;overflow:hidden!important}video{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important}';
                doc.head.appendChild(style);
                doc.querySelectorAll('video').forEach(video => {
                    video.addEventListener('canplay', () => playAutomatically(video), { once: true });
                    playAutomatically(video);
                });
            } catch { /* Cross-origin embed pages control their own player layout. */ }
        }} />;
}
