/* Galerías de fotos ([data-gallery], ver GalleryGrid.tsx): al tocar una foto
   se abre el visor del mapa de Batucada.

   El visor (y GSAP detrás de él) se pide con `import()`: así el oyente de
   clics queda puesto en cuanto llega este módulo, que pesa casi nada. Con un
   import estático el oyente esperaba a ~200 KB de módulos pedidos con
   prioridad baja, y quien tocaba una foto antes —lo normal en un teléfono—
   acababa en el archivo de la foto, en /media/<foto>. */
import type { ViewerPhoto } from "../utils/sector-photos";
import type { ViewerStrings } from "./batucada/viewer";
import { whenIdle } from "./platform";

let viewer: Promise<typeof import("./batucada/viewer")> | null = null;
const loadViewer = () =>
    (viewer ??= import("./batucada/viewer").catch((error) => {
        viewer = null;
        throw error;
    }));
const preload = () => void loadViewer().catch(() => {});

function initGallery(gallery: HTMLElement): void {
    gallery.dataset.galleryReady = "";

    let photos: ViewerPhoto[];
    let strings: ViewerStrings;
    try {
        photos = JSON.parse(gallery.dataset.gallery ?? "[]");
        strings = JSON.parse(gallery.dataset.galleryStrings ?? "");
    } catch {
        return; /* Sin datos legibles quedan los enlaces a cada foto. */
    }

    const open = async (index: number, trigger: HTMLElement, fallback?: string) => {
        trigger.setAttribute("aria-busy", "true");
        try {
            const { openViewer } = await loadViewer();
            openViewer({ photos, index, caption: gallery.dataset.galleryCaption ?? "", strings, trigger });
        } catch {
            if (fallback) window.location.assign(fallback);
        } finally {
            trigger.removeAttribute("aria-busy");
        }
    };

    gallery.addEventListener("click", (event) => {
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("[data-gallery-photo]");
        /* Ctrl/Cmd/Mayús + clic sigue abriendo la foto en otra pestaña. */
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        void open(Number(link.dataset.galleryPhoto), link, link.href);
    });

    /* «Ver en pantalla completa», si la sección lo trae: sin JS no sirve, así
       que sale oculto y se muestra aquí. */
    const button = gallery.closest("section")?.querySelector<HTMLButtonElement>("[data-gallery-open]");
    if (button) {
        button.hidden = false;
        button.addEventListener("click", () => void open(0, button));
    }

    gallery.addEventListener("pointerover", preload, { once: true });
    gallery.addEventListener("focusin", preload, { once: true });
}

/** Arranca las galerías de la página que aún no lo estén. */
export function initGalleries(): void {
    const galleries = document.querySelectorAll<HTMLElement>("[data-gallery]:not([data-gallery-ready])");
    if (!galleries.length) return;
    galleries.forEach(initGallery);
    /* Se adelanta la descarga del visor en cuanto el navegador quede libre. */
    whenIdle(preload, 3000);
}
