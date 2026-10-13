/* Fachada de los vídeos de YouTube y Vimeo (bloque «Vídeo» del constructor):
   la página solo trae una miniatura y un enlace al vídeo; el reproductor
   embebido se carga al pulsar. Sin JavaScript el enlace abre el vídeo en su
   sitio. Ver src/utils/video-embed.ts. */

const ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";

export function initVideoEmbeds(): void {
    document.querySelectorAll<HTMLAnchorElement>("a[data-video-embed]:not([data-video-ready])").forEach((link) => {
        link.dataset.videoReady = "";
        link.addEventListener("click", (event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const src = link.dataset.videoEmbed;
            if (!src) return;
            event.preventDefault();
            const iframe = document.createElement("iframe");
            iframe.src = src;
            iframe.title = link.dataset.videoTitle ?? link.getAttribute("aria-label") ?? "";
            iframe.allow = ALLOW;
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = "strict-origin-when-cross-origin";
            iframe.className = "absolute inset-0 h-full w-full border-0";
            link.replaceWith(iframe);
            iframe.focus();
        });
    });
}
