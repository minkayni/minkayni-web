/* ──────────────────────────────────────────────────────────────────────────
   Visor de fotos a pantalla completa del mapa de Batucada.

   Se abre al tocar una polaroid: la foto grande, la tira de miniaturas para
   saltar entre ellas, y el contador. Teclado (flechas, Inicio/Fin, Escape,
   +/−/0), gestos (deslizar a los lados para cambiar, hacia abajo para cerrar,
   tocar o pellizcar para ampliar y arrastrar para moverse por la foto) y foco
   atrapado mientras está abierto, que se devuelve a la polaroid al cerrar.

   Tamaños: la tira pide miniaturas de 160 px y la foto grande, la candidata
   que encaje en la pantalla (hasta 1600 px). El archivo original, a su
   resolución completa, solo se pide al ampliar: así no lo paga quien nunca
   amplía. Todos los tamaños salen de Imagor por el proxy /media (ver
   sector-photos.ts).

   El DOM se construye una sola vez, la primera vez que alguien abre el visor,
   y se reutiliza: quien nunca toca una foto no paga nada.

   Los textos llegan traducidos desde la página (ver `data-bp-strings` en
   batucada-popular.astro): este módulo no conoce idiomas. Los estilos son
   utilidades de Tailwind escritas aquí como literales —el escáner las lee— y
   las animaciones viven en el <style is:global> de la página, junto a las del
   resto del mapa. */
import { ScrollSmoother } from "../main";
import type { ViewerPhoto } from "../../utils/sector-photos";
import { clampOffset, distance, maxZoom, midpoint, offsetAfterZoom, type Point } from "./zoom";
import { prefersReducedMotion } from "../platform";
import { project, rubberband, Spring, VelocityTracker } from "../spring";

export type ViewerStrings = {
    /** Nombre accesible del diálogo. */
    label: string;
    close: string;
    previous: string;
    next: string;
    zoomIn: string;
    zoomOut: string;
    /** Con `{index}`: ir a esa miniatura. */
    goTo: string;
    /** Con `{index}` y `{count}`: «2 de 4». */
    position: string;
};

type OpenOptions = {
    photos: readonly ViewerPhoto[];
    /** Foto por la que se abre. */
    index?: number;
    /** Pie de foto: el sector al que pertenecen. */
    caption?: string;
    strings: ViewerStrings;
    /** Elemento al que devolver el foco al cerrar. */
    trigger?: HTMLElement | null;
};

const format = (template: string, params: Record<string, string | number>): string =>
    template.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));

/* Botón rombo: el mismo gesto gráfico que los pines del mapa y los números
   de la lista de sectores. El contenido se gira al revés para leerse recto. */
const DIAMOND =
    "grid h-11 w-11 shrink-0 cursor-pointer place-items-center rotate-45 border-2 border-black bg-accent text-black shadow-[3px_3px_0_rgba(10,8,1,0.55)] transition-[scale,background-color] duration-[180ms] ease-bp-rebound hover:scale-110 hover:bg-bp-blue focus-visible:outline-[3px] focus-visible:outline-offset-[6px] focus-visible:outline-white disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none";
const DIAMOND_LABEL = "-rotate-45 text-[1.15rem] font-black leading-none";

/** Distancia mínima de un gesto para que cuente como deslizar. */
const SWIPE_X = 45;
const SWIPE_DOWN = 90;
/** A partir de aquí un arrastre deja de ser un toque y no amplía al soltar. */
const DRAG_SLOP = 8;
/** Ampliación a la que salta un toque sobre la foto. */
const TAP_ZOOM = 2.2;
/** Paso de la rueda y de las teclas + y −. */
const ZOOM_STEP = 1.35;

let root: HTMLElement | null = null;
let stage: HTMLElement;
let frameEl: HTMLElement;
let mediaEl: HTMLElement;
let image: HTMLImageElement;
let captionEl: HTMLElement;
let noteEl: HTMLElement;
let positionEl: HTMLElement;
let thumbsEl: HTMLElement;
let prevButton: HTMLButtonElement;
let nextButton: HTMLButtonElement;
let zoomButton: HTMLButtonElement;
let zoomLabel: HTMLElement;

let photos: readonly ViewerPhoto[] = [];
let current = 0;
let strings: ViewerStrings | null = null;
let caption = "";
let lastFocused: HTMLElement | null = null;
let previousOverflow = "";
let pausedSmoother: { paused: (value?: boolean) => boolean } | null = null;
/* Oyentes de carga de la foto en curso: se cancelan al pasar a otra. */
let imageListeners: AbortController | null = null;

/* Estado del zoom. `limit` es lo que da de sí ESTA foto (ver zoom.ts). */
let scale = 1;
let offset: Point = { x: 0, y: 0 };
let limit = 1;
let highRes = false;

const isOpen = () => Boolean(root && !root.classList.contains("hidden"));

/* ───────────────────────────────── zoom ──────────────────────────────── */

const mediaBox = () => {
    const box = mediaEl.getBoundingClientRect();
    return { width: box.width, height: box.height, centerX: box.left + box.width / 2, centerY: box.top + box.height / 2 };
};

/** Punto de pantalla → coordenadas relativas al centro de la foto. */
const toMedia = (x: number, y: number): Point => {
    const box = mediaBox();
    return { x: x - box.centerX, y: y - box.centerY };
};

const paintZoom = (): void => {
    image.style.transform = scale === 1 ? "" : `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`;
    if (scale > 1) mediaEl.dataset.zoomed = "";
    else delete mediaEl.dataset.zoomed;
    if (!strings) return;
    /* El botón dice lo que hará, no dónde está: a la ida amplía, a la vuelta
       devuelve la foto entera. */
    zoomButton.setAttribute("aria-label", scale > 1 ? strings.zoomOut : strings.zoomIn);
    zoomButton.setAttribute("aria-pressed", String(scale > 1));
    zoomButton.disabled = limit <= 1;
    zoomLabel.textContent = scale > 1 ? "−" : "+";
};

/** Cuánto se puede ampliar la foto actual sin que sean solo píxeles. */
const measureZoom = (): void => {
    const photo = photos[current];
    const width = mediaBox().width;
    /* La resolución que se PUEDE llegar a enseñar, no la que se ve ahora: al
       ampliar se pide el archivo original, y `photo.width` es su ancho real
       según el CMS. Así el tope ya es el bueno antes de que llegue. */
    const source = Math.max(image.naturalWidth, photo?.width ?? 0);
    limit = maxZoom(source, width);
    if (scale > limit) setZoom(limit);
};

/** Pide la versión de resolución alta, ya ampliando. */
const loadHighRes = (): void => {
    const photo = photos[current];
    if (!photo || highRes || !photo.zoom || photo.zoom === photo.full) return;
    highRes = true;
    const token = current;
    const upgrade = new Image();
    upgrade.addEventListener("load", () => {
        /* Puede haber cambiado de foto o haberse cerrado mientras bajaba. */
        if (token !== current || !isOpen()) return;
        /* El srcset manda sobre src: hay que quitarlo, o el navegador seguiría
           enseñando la candidata de 1600 px. */
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
        image.src = photo.zoom;
        measureZoom();
    });
    upgrade.src = photo.zoom;
};

function setZoom(next: number, pointer: Point = { x: 0, y: 0 }): void {
    const target = Math.min(Math.max(next, 1), limit);
    if (target === scale) return;
    offset = target === 1 ? { x: 0, y: 0 } : clampOffset(offsetAfterZoom(pointer, offset, scale, target), target, mediaBox());
    scale = target;
    paintZoom();
    if (scale > 1) loadHighRes();
}

const resetZoom = (): void => {
    scale = 1;
    offset = { x: 0, y: 0 };
    highRes = false;
    paintZoom();
};

const toggleZoom = (pointer: Point): void => setZoom(scale > 1 ? 1 : Math.min(TAP_ZOOM, limit), pointer);

/* ──────────────────────────────── gestos ─────────────────────────────── */

const pointers = new Map<number, Point>();
let mode: "none" | "swipe" | "pan" | "pinch" = "none";
let dragged = false;
let startOffset: Point = { x: 0, y: 0 };
let startScale = 1;
let startDistance = 0;
let startMid: Point = { x: 0, y: 0 };
let startPoint: Point = { x: 0, y: 0 };

/* Deslizar con la foto entera: la foto va pegada al dedo y, al soltar, decide
   según dónde ACABARÍA el gesto (proyección de Apple), no dónde se soltó: un
   golpe corto y rápido pasa de foto. La siguiente entra desde el lado hacia
   el que se lanzó, heredando la velocidad; si no pasa, vuelve con un resorte.
   `translate` y no `transform`, que es del zoom. */
const swipeTracker = new VelocityTracker();
const paintSwipe = () => {
    const x = swipeX.value;
    const y = swipeY.value;
    image.style.translate = x || y ? `${x.toFixed(1)}px ${y.toFixed(1)}px` : "";
};
const swipeX = new Spring(0, "bouncy", paintSwipe);
const swipeY = new Spring(0, "bouncy", paintSwipe);
let swipeAxis: "x" | "y" | null = null;
let swipeStart: Point = { x: 0, y: 0 };
const followsFinger = () => !prefersReducedMotion();

const resetSwipe = (): void => {
    swipeX.jump(0);
    swipeY.jump(0);
};

const trackSwipe = (dx: number, dy: number): void => {
    if (!followsFinger()) return;
    if (!swipeAxis && (Math.abs(dx) > DRAG_SLOP || Math.abs(dy) > DRAG_SLOP)) swipeAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (swipeAxis === "x") {
        const x = swipeStart.x + dx;
        /* Sin foto hacia ese lado: cede como una goma en vez de topar. */
        const edge = photos.length < 2 || (x > 0 && current === 0) || (x < 0 && current === photos.length - 1);
        swipeX.jump(edge ? rubberband(x, mediaEl.clientWidth || 400) : x);
    } else if (swipeAxis === "y") {
        const y = swipeStart.y + dy;
        swipeY.jump(y < 0 ? rubberband(y, mediaEl.clientHeight || 400) : y);
    }
};

/** Termina un deslizamiento. `true` si pasó de foto o cerró. */
const releaseSwipe = (dx: number, dy: number): boolean => {
    const v = swipeTracker.velocity();
    const axis = swipeAxis ?? (Math.abs(dx) > Math.abs(dy) ? "x" : "y");
    swipeAxis = null;
    const landX = dx + project(v.x, 0.99);
    const landY = dy + project(v.y, 0.99);

    if (axis === "x" && Math.abs(landX) > SWIPE_X && Math.sign(landX) === Math.sign(dx || landX)) {
        const delta = landX < 0 ? 1 : -1;
        const target = current + delta;
        if (photos.length > 1 && target >= 0 && target < photos.length) {
            step(delta);
            if (followsFinger()) {
                /* La nueva foto entra desde el lado contrario, con el impulso del dedo. */
                swipeY.jump(0);
                swipeX.jump(delta * Math.min(120, (mediaEl.clientWidth || 400) * 0.25));
                swipeX.to(0, { velocity: v.x, spring: "bouncy" });
            }
            return true;
        }
    }
    if (axis === "y" && landY > SWIPE_DOWN && dy > 0) {
        close();
        return true;
    }
    swipeX.to(0, { velocity: v.x, spring: "bouncy" });
    swipeY.to(0, { velocity: v.y, spring: "bouncy" });
    return false;
};

const twoPointers = (): [Point, Point] => {
    const [a, b] = [...pointers.values()];
    return [a, b];
};

const stopTracking = (): void => {
    mode = "none";
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
};

function onPointerDown(event: PointerEvent): void {
    /* Un botón (pasar de foto, cerrar, ampliar) no arrastra nada. */
    if ((event.target as HTMLElement).closest("button")) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
        dragged = false;
        startPoint = { x: event.clientX, y: event.clientY };
        startOffset = { ...offset };
        mode = scale > 1 ? "pan" : "swipe";
        /* Agarrar la foto mientras aún vuelve: parte de donde se ve, no de 0. */
        swipeStart = { x: swipeX.value, y: swipeY.value };
        swipeAxis = null;
        swipeTracker.reset();
        swipeTracker.add(event.clientX, event.clientY);
    } else if (pointers.size === 2) {
        swipeX.to(0, { spring: "snappy" });
        swipeY.to(0, { spring: "snappy" });
        const [a, b] = twoPointers();
        mode = "pinch";
        dragged = true;
        startDistance = distance(a, b);
        startMid = midpoint(a, b);
        startOffset = { ...offset };
        startScale = scale;
    }

    /* En `window` y no en la escena: si el dedo sale del visor, el gesto
       termina igual en vez de quedarse pegado. */
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
}

function onPointerMove(event: PointerEvent): void {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (mode === "pinch" && pointers.size >= 2 && startDistance > 0) {
        const [a, b] = twoPointers();
        const target = Math.min(Math.max((startScale * distance(a, b)) / startDistance, 1), limit);
        /* El pellizco amplía hacia donde empezó y además acompaña el
           desplazamiento de los dos dedos. */
        const mid = midpoint(a, b);
        const zoomed = offsetAfterZoom(toMedia(startMid.x, startMid.y), startOffset, startScale, target);
        scale = target;
        offset = clampOffset({ x: zoomed.x + (mid.x - startMid.x), y: zoomed.y + (mid.y - startMid.y) }, target, mediaBox());
        paintZoom();
        if (scale > 1) loadHighRes();
        return;
    }

    const dx = event.clientX - startPoint.x;
    const dy = event.clientY - startPoint.y;
    if (Math.abs(dx) > DRAG_SLOP || Math.abs(dy) > DRAG_SLOP) dragged = true;

    if (mode === "swipe") {
        swipeTracker.add(event.clientX, event.clientY);
        trackSwipe(dx, dy);
    }

    if (mode === "pan") {
        offset = clampOffset({ x: startOffset.x + dx, y: startOffset.y + dy }, scale, mediaBox());
        paintZoom();
    }
}

function onPointerUp(event: PointerEvent): void {
    const was = mode;
    pointers.delete(event.pointerId);

    /* Deslizar solo cambia de foto con la foto entera: ampliada, el dedo la
       mueve por dentro. */
    if (was === "swipe" && pointers.size === 0) {
        const dx = event.clientX - startPoint.x;
        const dy = event.clientY - startPoint.y;
        if (followsFinger()) releaseSwipe(dx, dy);
        else if (Math.abs(dx) > SWIPE_X && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
        else if (dy > SWIPE_DOWN && dy > Math.abs(dx)) close();
    }

    if (pointers.size === 1) {
        /* De pellizcar a arrastrar, con el dedo que queda. */
        const [remaining] = [...pointers.values()];
        mode = scale > 1 ? "pan" : "none";
        startPoint = { ...remaining };
        startOffset = { ...offset };
    } else if (pointers.size === 0) {
        stopTracking();
    }
}

/* ─────────────────────────────── construcción ────────────────────────── */

const build = (): HTMLElement => {
    const node = document.createElement("div");
    node.className = "bp-viewer fixed inset-0 z-[120] hidden";
    node.setAttribute("role", "dialog");
    node.setAttribute("aria-modal", "true");
    node.innerHTML =
        /* Fondo opaco, no translúcido: con un 5 % de transparencia la página
           seguía leyéndose por detrás de la foto (texto claro sobre morado) y
           el visor parecía un velo. El grano es el mismo del campo de tinta. */
        `<div class="absolute inset-0 bg-black [background-image:var(--bp-noise)] [background-blend-mode:soft-light]" data-viewer-close aria-hidden="true"></div>` +
        `<div class="relative mx-auto flex h-full w-full max-w-[1480px] flex-col gap-3 p-4 sm:gap-4 sm:p-6">` +
        `<div class="flex shrink-0 items-center justify-between gap-4">` +
        `<p class="text-[0.78rem] font-black uppercase tracking-[0.16em] text-white" data-viewer-position></p>` +
        `<div class="flex shrink-0 items-center gap-3">` +
        `<button type="button" class="${DIAMOND}" data-viewer-zoom aria-pressed="false"><span class="${DIAMOND_LABEL}" data-viewer-zoom-label aria-hidden="true">+</span></button>` +
        `<button type="button" class="${DIAMOND}" data-viewer-close><span class="${DIAMOND_LABEL}" aria-hidden="true">✕</span></button>` +
        `</div>` +
        `</div>` +
        `<div class="relative flex min-h-0 flex-1 touch-none items-center justify-center" data-viewer-stage>` +
        `<button type="button" class="${DIAMOND} absolute left-0 top-1/2 z-[2] -translate-y-1/2" data-viewer-prev><span class="${DIAMOND_LABEL}" aria-hidden="true">←</span></button>` +
        /* Marco blanco y eco azul: sobre el campo de tinta, un borde negro
           desaparece y la foto queda flotando sin recortar. Es el mismo par
           —marco claro, sombra dura de color— que el resto de fotos del
           proyecto sobre fondo oscuro. */
        `<figure class="bp-viewer__frame m-0 flex max-h-full min-h-0 flex-col border-[3px] border-white bg-white shadow-[10px_10px_0_var(--color-bp-blue)]">` +
        /* La foto ampliada se sale de su caja: el recorte lo pone este
           envoltorio, para que el marco y el pie no se muevan. */
        `<div class="bp-viewer__media relative min-h-0 cursor-zoom-in overflow-hidden data-[zoomed]:cursor-grab" data-viewer-media>` +
        `<img class="bp-viewer__image block h-auto max-h-full w-full origin-center object-contain" data-viewer-image alt="" decoding="async">` +
        `</div>` +
        /* Dos líneas: de qué barrio es la foto y, debajo, la leyenda que
           haya escrito quien la subió. La segunda se oculta si no la hay,
           para que el pie no crezca con una línea vacía. */
        `<figcaption class="shrink-0 border-t-[3px] border-black px-4 py-[0.6rem] text-black">` +
        `<span class="block text-[0.72rem] font-black uppercase tracking-[0.08em]" data-viewer-caption></span>` +
        `<span class="mt-[0.35rem] block max-w-[70ch] text-[0.84rem] font-normal leading-snug" data-viewer-note></span>` +
        `</figcaption>` +
        `</figure>` +
        `<button type="button" class="${DIAMOND} absolute right-0 top-1/2 z-[2] -translate-y-1/2" data-viewer-next><span class="${DIAMOND_LABEL}" aria-hidden="true">→</span></button>` +
        `</div>` +
        /* La tira va centrada también en el teléfono. El centrado lo pone
           `mx-auto` en la fila y no `justify-center` en el contenedor que
           desplaza: con eso último, en cuanto las miniaturas no caben, las
           primeras quedan fuera de alcance. */
        `<div class="flex shrink-0 touch-pan-x overflow-x-auto overscroll-none px-1 pb-1" data-viewer-thumbs-scroll>` +
        `<div class="mx-auto flex gap-2" data-viewer-thumbs></div>` +
        `</div>` +
        `</div>`;

    document.body.appendChild(node);

    stage = node.querySelector("[data-viewer-stage]") as HTMLElement;
    frameEl = node.querySelector(".bp-viewer__frame") as HTMLElement;
    mediaEl = node.querySelector("[data-viewer-media]") as HTMLElement;
    image = node.querySelector("[data-viewer-image]") as HTMLImageElement;
    captionEl = node.querySelector("[data-viewer-caption]") as HTMLElement;
    noteEl = node.querySelector("[data-viewer-note]") as HTMLElement;
    positionEl = node.querySelector("[data-viewer-position]") as HTMLElement;
    thumbsEl = node.querySelector("[data-viewer-thumbs]") as HTMLElement;
    prevButton = node.querySelector("[data-viewer-prev]") as HTMLButtonElement;
    nextButton = node.querySelector("[data-viewer-next]") as HTMLButtonElement;
    zoomButton = node.querySelector("[data-viewer-zoom]") as HTMLButtonElement;
    zoomLabel = node.querySelector("[data-viewer-zoom-label]") as HTMLElement;

    node.querySelectorAll("[data-viewer-close]").forEach((button) => button.addEventListener("click", close));
    prevButton.addEventListener("click", () => step(-1));
    nextButton.addEventListener("click", () => step(1));
    zoomButton.addEventListener("click", () => toggleZoom({ x: 0, y: 0 }));
    thumbsEl.addEventListener("click", (event) => {
        const thumb = (event.target as HTMLElement).closest<HTMLElement>("[data-viewer-index]");
        if (thumb) show(Number(thumb.dataset.viewerIndex));
    });

    /* Tocar la foto amplía hacia ese punto, y otro toque la devuelve entera.
       Arrastrar o pellizcar no cuenta como toque. */
    mediaEl.addEventListener("click", (event) => {
        if (dragged) return;
        toggleZoom(toMedia(event.clientX, event.clientY));
    });
    /* Tocar fuera de la foto cierra, igual que el fondo. */
    stage.addEventListener("click", (event) => {
        if (event.target === stage && !dragged) close();
    });
    /* La rueda amplía hacia donde apunta el cursor. */
    stage.addEventListener(
        "wheel",
        (event) => {
            if (!event.deltaY || limit <= 1) return;
            event.preventDefault();
            setZoom(event.deltaY < 0 ? scale * ZOOM_STEP : scale / ZOOM_STEP, toMedia(event.clientX, event.clientY));
        },
        { passive: false },
    );

    stage.addEventListener("pointerdown", onPointerDown);

    return node;
};

/* ──────────────────────────────── pintado ────────────────────────────── */

/* Tope de ampliación del marco. La foto crece hasta llenar el hueco, pero no
   más de dos veces y media su tamaño real: pasado eso ya no se ve una foto
   grande, se ve una foto deshecha. Las tres genéricas del proyecto miden
   400 px, así que se quedan cortas hasta que el CMS tenga las del barrio. */
const MAX_UPSCALE = 2.5;

/** Da al marco el tamaño de la foto dentro del hueco disponible. */
const fitFrame = (): void => {
    if (!isOpen()) return;
    const photo = photos[current];
    const width = image.naturalWidth || photo?.width || 0;
    const height = image.naturalHeight || photo?.height || 0;
    if (!width || !height) return;

    const room = stage.getBoundingClientRect();
    /* `captionEl.offsetHeight` no basta: el pie incluye la leyenda, que puede
       ocupar dos líneas y cambia de una foto a otra. */
    const free = { width: room.width - 6, height: room.height - (captionEl.parentElement?.offsetHeight ?? 0) - 6 };
    if (free.width <= 0 || free.height <= 0) return;

    const fit = Math.min(free.width / width, free.height / height, MAX_UPSCALE);
    frameEl.style.width = `${Math.round(width * fit)}px`;
    measureZoom();
};

/** Salta a una foto concreta. */
const show = (next: number): void => {
    if (!root || !photos.length) return;
    current = Math.min(Math.max(next, 0), photos.length - 1);
    const photo = photos[current];
    resetZoom();

    /* La foto entra con un fundido corto: sin él, cambiar de foto en una red
       lenta deja el marco vacío de golpe. */
    image.classList.add("is-loading");
    image.src = photo.full;
    if (photo.srcset) {
        image.srcset = photo.srcset;
        /* Sin `sizes` el navegador supone el ancho de la ventana y se trae la
           candidata más grande aunque la foto se vea a la mitad. */
        image.sizes = "(min-width: 1480px) 1480px, 100vw";
    } else {
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
    }
    image.alt = photo.alt;
    if (photo.width) image.width = photo.width;
    if (photo.height) image.height = photo.height;
    const done = () => {
        image.classList.remove("is-loading");
        fitFrame();
    };
    fitFrame();
    imageListeners?.abort();
    imageListeners = new AbortController();
    const { signal } = imageListeners;
    if (image.complete) done();
    else image.addEventListener("load", done, { once: true, signal });
    image.addEventListener("error", done, { once: true, signal });

    /* El contador vive arriba; el pie, debajo de la foto, dice de qué barrio
       es. Repetir «1 de 3» en los dos sitios solo hacía más ruido. */
    const position = format(strings!.position, { index: current + 1, count: photos.length });
    positionEl.textContent = position;
    captionEl.textContent = caption || position;
    noteEl.textContent = photo.caption ?? "";
    noteEl.hidden = !photo.caption;

    const single = photos.length < 2;
    prevButton.disabled = single || current === 0;
    nextButton.disabled = single || current === photos.length - 1;
    prevButton.hidden = single;
    nextButton.hidden = single;

    thumbsEl.querySelectorAll<HTMLElement>("[data-viewer-index]").forEach((thumb, index) => {
        if (index === current) thumb.dataset.active = "";
        else delete thumb.dataset.active;
        thumb.setAttribute("aria-current", index === current ? "true" : "false");
        if (index === current) thumb.scrollIntoView({ block: "nearest", inline: "nearest" });
    });

    /* Adelantar las vecinas: al pasar de foto ya están en la caché. */
    for (const neighbour of [photos[current - 1], photos[current + 1]]) {
        if (!neighbour) continue;
        const preload = new Image();
        if (neighbour.srcset) preload.srcset = neighbour.srcset;
        preload.src = neighbour.full;
    }
};

function step(delta: number): void {
    if (photos.length < 2) return;
    show(current + delta);
}

const renderThumbs = (): void => {
    if (photos.length < 2) {
        thumbsEl.innerHTML = "";
        thumbsEl.hidden = true;
        return;
    }
    thumbsEl.hidden = false;
    thumbsEl.innerHTML = photos
        .map(
            (photo, index) =>
                `<button type="button" class="relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden border-2 border-black bg-white opacity-55 transition-[opacity,scale] duration-[180ms] ease-bp-rebound hover:opacity-100 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-white data-[active]:border-accent data-[active]:opacity-100 motion-reduce:transition-none" data-viewer-index="${index}">` +
                `<img src="${photo.strip}" alt="" width="160" height="96" class="block h-full w-full object-cover" loading="lazy" decoding="async">` +
                `</button>`,
        )
        .join("");
    thumbsEl.querySelectorAll<HTMLElement>("[data-viewer-index]").forEach((thumb, index) => {
        thumb.setAttribute("aria-label", format(strings!.goTo, { index: index + 1 }));
    });
};

const focusables = (): HTMLElement[] =>
    root ? Array.from(root.querySelectorAll<HTMLElement>("button:not([disabled]):not([hidden])")) : [];

const onKeydown = (event: KeyboardEvent): void => {
    if (!isOpen()) return;
    switch (event.key) {
        case "Escape":
            event.preventDefault();
            /* Ampliada, Escape primero devuelve la foto entera. */
            if (scale > 1) resetZoom();
            else close();
            break;
        case "ArrowRight":
            event.preventDefault();
            step(1);
            break;
        case "ArrowLeft":
            event.preventDefault();
            step(-1);
            break;
        case "Home":
            event.preventDefault();
            show(0);
            break;
        case "End":
            event.preventDefault();
            show(photos.length - 1);
            break;
        case "+":
        case "=":
            event.preventDefault();
            setZoom(scale * ZOOM_STEP);
            break;
        case "-":
            event.preventDefault();
            setZoom(scale / ZOOM_STEP);
            break;
        case "0":
            event.preventDefault();
            resetZoom();
            break;
        case "Tab": {
            /* Foco atrapado: el tabulador no puede salirse a la página de
               detrás, que está tapada y no se puede usar. */
            const items = focusables();
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement as HTMLElement | null;
            if (event.shiftKey && (active === first || !root!.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
            break;
        }
        default:
            break;
    }
};

/* Al girar el teléfono cambia el hueco y, con él, cuánto se puede ampliar:
   lo más honrado es devolver la foto entera y volver a encajarla. */
const onResize = (): void => {
    resetZoom();
    fitFrame();
};

const lockPage = (): void => {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    /* En escritorio el scroll lo mueve ScrollSmoother con transformaciones,
       así que `overflow: hidden` no lo detiene: hay que pausarlo. */
    const smoother = ScrollSmoother.get?.();
    if (smoother && !smoother.paused()) {
        smoother.paused(true);
        pausedSmoother = smoother;
    }
};

const unlockPage = (): void => {
    document.documentElement.style.overflow = previousOverflow;
    pausedSmoother?.paused(false);
    pausedSmoother = null;
};

export function close(): void {
    if (!isOpen()) return;
    resetZoom();
    resetSwipe();
    pointers.clear();
    stopTracking();
    root!.classList.add("hidden");
    unlockPage();
    document.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("resize", onResize);
    /* Devolver el foco a la polaroid desde la que se abrió: quien navega con
       teclado vuelve justo donde estaba, no al principio de la página. */
    lastFocused?.focus({ preventScroll: true });
    lastFocused = null;
}

export const openViewer = ({ photos: list, index = 0, caption: label = "", strings: texts, trigger }: OpenOptions): void => {
    if (!list.length) return;

    photos = list;
    strings = texts;
    caption = label;
    lastFocused = trigger ?? (document.activeElement as HTMLElement | null);

    root ??= build();
    root.setAttribute("aria-label", texts.label);
    root.querySelectorAll("[data-viewer-close]").forEach((node) => {
        if (node instanceof HTMLButtonElement) node.setAttribute("aria-label", texts.close);
    });
    prevButton.setAttribute("aria-label", texts.previous);
    nextButton.setAttribute("aria-label", texts.next);

    renderThumbs();
    /* La animación de entrada del marco se reinicia en cada apertura. */
    frameEl.classList.remove("bp-viewer__frame");
    void frameEl.offsetWidth;
    frameEl.classList.add("bp-viewer__frame");

    root.classList.remove("hidden");
    lockPage();
    show(index);
    document.addEventListener("keydown", onKeydown, true);
    window.addEventListener("resize", onResize);
    /* El foco entra en el visor por el botón de cerrar: es la salida, y desde
       ahí el tabulador recorre el resto de controles. */
    (root.querySelector("[data-viewer-close]") as HTMLElement | null)?.focus({ preventScroll: true });
};
