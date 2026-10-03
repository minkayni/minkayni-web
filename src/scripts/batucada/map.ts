import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { galleryLayout, hoverCardPlacement, isStripLayout, MAX_SPOTS } from "./gallery-layout";
import { openViewer, type ViewerStrings } from "./viewer";
import type { ViewerPhoto } from "../../utils/sector-photos";
import { prefersReducedMotion } from "../platform";

/* Sectores de la Batucada Popular en Guayaquil.
   Coordenadas de OpenStreetMap (Nominatim, julio 2026); donde el sector
   no existe como lugar nombrado en OSM (Trinipuerto, Cisne 1) se usa el
   punto aproximado del barrio — los pines señalan sectores, no direcciones. */
export const SECTORS = [
    { name: "Socio Vivienda", lat: -2.1321, lng: -79.9697 },
    { name: "Mapasingue", lat: -2.1536, lng: -79.9239 },
    { name: "Trinipuerto", lat: -2.252, lng: -79.911 },
    { name: "Nigeria", lat: -2.229, lng: -79.9198 },
    { name: "Sergio Toral 1", lat: -2.1142, lng: -79.9884 },
    { name: "Sergio Toral 2", lat: -2.1098, lng: -79.9897 },
    { name: "Bastión Popular, Bloque 2", lat: -2.0933, lng: -79.9257 },
    { name: "Suburbio, Cisne 1", lat: -2.215, lng: -79.907 },
    { name: "Suburbio, Cisne 2", lat: -2.2217, lng: -79.9188 },
    { name: "Guasmo Sur", lat: -2.2673, lng: -79.8927 },
    { name: "Nueva Prosperina", lat: -2.1201, lng: -79.9806 },
    { name: "Paraíso de la Flor", lat: -2.1016, lng: -79.9556 },
] as const;

/* Mapa Leaflet con teselas CARTO (base OpenStreetMap). Se inicializa
   perezosamente cuando la sección se acerca al viewport.
   Interacción: clic en un sector (lista o pin) vuela al barrio y abre su
   popup con enlace "Cómo llegar"; el botón [data-bp-map-reset] devuelve
   la vista de los 12; hover sincronizado en ambos sentidos. */
export const initBatucadaMap = () => {
    const el = document.getElementById("bp-map");
    const status = document.querySelector<HTMLElement>("[data-bp-map-status]");
    if (!el || el.dataset.state === "loading" || el.dataset.state === "ready") return;

    /* Los sectores llegan serializados desde la página (contenido de Strapi
       vía data-bp-sectors), con sus fotos ya resueltas a rutas del proxy de
       medios; SECTORS queda como respaldo si faltan o son inválidos. El orden
       enlaza la lista de la página con los pines. */
    type Sector = { name: string; lat: number; lng: number; photos?: ViewerPhoto[] };
    let sectors: readonly Sector[] = SECTORS;
    try {
        const raw = el.dataset.bpSectors;
        if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                const clean = parsed.filter(
                    (s): s is Sector => !!s && typeof s.name === "string" && Number.isFinite(s.lat) && Number.isFinite(s.lng)
                );
                if (clean.length) sectors = clean;
            }
        }
    } catch {
        /* JSON inválido → se usa el respaldo local */
    }

    const photosOf = (index: number): ViewerPhoto[] => sectors[index]?.photos ?? [];

    /* Textos de interfaz, traducidos en la página (data-bp-strings): este
       módulo no conoce idiomas. Sin el atributo —o con un JSON roto— el mapa
       sigue funcionando y solo se queda sin etiquetas accesibles. */
    type MapStrings = ViewerStrings & { open: string; error: string };
    const EMPTY_STRINGS: MapStrings = { label: "", close: "", previous: "", next: "", zoomIn: "", zoomOut: "", goTo: "", position: "", open: "", error: "" };
    let strings = EMPTY_STRINGS;
    try {
        const raw = el.dataset.bpStrings;
        if (raw) strings = { ...EMPTY_STRINGS, ...(JSON.parse(raw) as Partial<MapStrings>) };
    } catch {
        /* JSON inválido → etiquetas vacías, nunca una excepción */
    }
    const text = (template: string, params: Record<string, string | number>): string =>
        template.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));

    const reduceMotion = prefersReducedMotion();

    const setState = (state: "loading" | "ready" | "error", message?: string) => {
        el.dataset.state = state;
        el.setAttribute("aria-busy", String(state === "loading"));
        if (message && status) status.textContent = message;
    };

    const boot = () => {
        /* Sin mensaje: el que ya está en el HTML viene traducido desde la página. */
        setState("loading");

        try {
            const map = L.map(el, {
                scrollWheelZoom: false, // el scroll de página manda; zoom con controles, doble clic o pellizco
                attributionControl: true,
                zoomControl: true,
            });

            /* CARTO sirve las teselas raster sin clave, pero con una marca de
               agua "API key required"; con `?key=` válida las sirve limpias.

               Las claves de CARTO se restringen por dominio, así que una clave
               que no cubra el dominio desde el que se sirve la página devuelve
               403 y el mapa se quedaría EN BLANCO: peor que la marca de agua.
               Por eso, al primer error de tesela se reintenta sin clave. */
            const cartoKey = el.dataset.cartoKey;
            const BASE_TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
            const tileUrl = cartoKey ? `${BASE_TILES}?key=${encodeURIComponent(cartoKey)}` : BASE_TILES;

            const tiles = L.tileLayer(tileUrl, {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: "abcd",
                maxZoom: 18,
                minZoom: 10,
            }).addTo(map);

            if (cartoKey) {
                tiles.once("tileerror", () => {
                    console.warn("[bp-map] CARTO rechazó la clave para este dominio; se usan las teselas sin clave (con marca de agua). Autoriza el dominio en https://carto.com/basemaps/apikey");
                    tiles.setUrl(BASE_TILES);
                });
            }

            const bounds = L.latLngBounds(sectors.map((sector) => [sector.lat, sector.lng]));

            /* Pin rombo en utilidades Tailwind (los .ts entran en la detección
               de contenido). El número va en span interno con display:block —
               los transforms no aplican a inline. El estado activo se conmuta
               INTERCAMBIANDO clases (nunca apilando bg-* en conflicto). */
            const PIN_IDLE = ["bg-bp-blue"];
            const PIN_ACTIVE = ["bg-accent", "scale-125"];
            const PIN =
                "bp-pin grid place-items-center w-full h-full rotate-45 bg-bp-blue border-2 border-black text-black font-black text-[0.68rem] shadow-[2px_2px_0_rgba(10,8,1,0.35)] spring group-hover:scale-125 group-hover:bg-accent motion-reduce:transition-none cursor-pointer";

            const markers = sectors.map((sector, index) => {
                const icon = L.divIcon({
                    className: "group",
                    html: `<span class="${PIN}"><span class="block -rotate-45">${String(index + 1).padStart(2, "0")}</span></span>`,
                    iconSize: [26, 26],
                    iconAnchor: [13, 13],
                });
                return L.marker([sector.lat, sector.lng], { icon, title: sector.name, alt: sector.name }).addTo(map);
            });

            /* Tarjeta polaroid de hover PROPIA (no un tooltip de Leaflet):
               vive en el wrap del mapa, fuera del overflow:hidden del
               .leaflet-container, así que puede desbordar el marco sin
               cortarse. Posición con la propiedad `translate` (la animación
               usa `transform` en el figure interno: no compiten). */
            const wrap = el.parentElement as HTMLElement;
            const frame = () => ({ width: wrap.clientWidth, height: wrap.clientHeight });
            const attr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

            const card = document.createElement("div");
            card.className = "bp-hover-card pointer-events-none absolute z-[5] hidden w-[200px] [translate:-50%_calc(-100%_-_14px)]";
            card.innerHTML =
                `<figure class="m-0 border-2 border-black bg-white text-black shadow-[4px_4px_0_rgba(10,8,1,0.35)] overflow-hidden">` +
                `<img src="" alt="" width="200" height="120" class="block w-full aspect-[5/3] max-w-none object-cover" decoding="async">` +
                `<figcaption class="px-3 py-2 text-[0.72rem] font-black uppercase tracking-[0.08em]"></figcaption>` +
                `</figure>`;
            wrap.appendChild(card);
            const cardFigure = card.querySelector("figure") as HTMLElement;
            const cardImg = card.querySelector("img") as HTMLImageElement;
            const cardCaption = card.querySelector("figcaption") as HTMLElement;

            const labelOf = (index: number) => `${String(index + 1).padStart(2, "0")} · ${sectors[index].name}`;

            const showCard = (index: number) => {
                const photo = photosOf(index)[0];
                if (!photo) return;
                cardImg.src = photo.thumb;
                cardCaption.textContent = labelOf(index);
                card.classList.remove("hidden");

                /* Encajada dentro del marco: pegada siempre encima del pin, se
                   comía la lista de sectores cuando el pin caía cerca del
                   borde de arriba; y se salía de la pantalla en los extremos. */
                const point = map.latLngToContainerPoint([sectors[index].lat, sectors[index].lng]);
                const place = hoverCardPlacement(frame(), { x: point.x, y: point.y }, { width: card.offsetWidth, height: card.offsetHeight });
                card.style.left = `${place.x}px`;
                card.style.top = `${place.y}px`;
                card.dataset.place = place.below ? "below" : "above";

                /* reiniciar la animación de entrada en cada hover */
                cardFigure.classList.remove("bp-tip");
                void cardFigure.offsetWidth;
                cardFigure.classList.add("bp-tip");
            };
            const hideCard = () => card.classList.add("hidden");
            map.on("movestart zoomstart", hideCard);

            /* Galería por sector: al hacer CLIC se vuela al barrio y, solo al
               aterrizar en ese nivel de zoom, aparecen sus fotos. Dónde se
               colocan lo decide gallery-layout.ts a partir del tamaño del
               marco: collage alrededor del pin si hay sitio, tira apoyada
               abajo en un teléfono. Tocar una abre el visor a pantalla
               completa. Cualquier pan o cambio de zoom las desmonta
               (movestart/zoomstart). */
            const gallery = document.createElement("div");
            gallery.className = "bp-map-gallery pointer-events-none absolute inset-0 z-[4] hidden";
            wrap.appendChild(gallery);

            /* Sector cuyas fotos están puestas: lo necesita el visor cuando se
               toca una, y sobrevive a que la galería se vuelva a dibujar. */
            let galleryIndex = -1;

            const showGallery = (index: number) => {
                const photos = photosOf(index);
                if (!photos.length) return;
                galleryIndex = index;

                const point = map.latLngToContainerPoint([sectors[index].lat, sectors[index].lng]);
                const box = frame();
                const spots = galleryLayout(box, { x: point.x, y: point.y }, Math.min(photos.length, MAX_SPOTS));
                /* La tira no flota: cuatro miniaturas en fila subiendo y
                   bajando para siempre marean y no dejan de repintar. El
                   collage sí, que es donde ese aire tiene sentido. */
                gallery.dataset.layout = isStripLayout(box.width) ? "strip" : "scatter";

                /* Dos retardos: entrada (rebote) y flotado continuo que
                   arranca cuando la entrada ya terminó — ambos animan
                   transform, así que no pueden solaparse. */
                gallery.innerHTML = spots
                    .map((spot, i) => {
                        const label = attr(text(strings.open, { index: i + 1, count: photos.length }));
                        return (
                            `<button type="button" data-bp-gallery-photo="${i}" aria-label="${label}"` +
                            ` class="bp-tip pointer-events-auto absolute m-0 block cursor-pointer overflow-hidden border-2 border-black bg-white p-0 shadow-[4px_4px_0_rgba(10,8,1,0.35)] spring hover:scale-[1.06] focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none [translate:-50%_-50%]"` +
                            ` style="left:${spot.x}px; top:${spot.y}px; width:${spot.width}px; height:${spot.height}px; rotate:${spot.rotate}deg; animation-delay:${spot.delay}ms,${spot.delay + 450}ms">` +
                            `<img src="${attr(photos[i].thumb)}" alt="" width="${spot.width}" height="${spot.height}" class="block h-full w-full max-w-none object-cover" decoding="async">` +
                            `</button>`
                        );
                    })
                    .join("");
                gallery.classList.remove("hidden");
            };
            const hideGallery = () => {
                gallery.classList.add("hidden");
                gallery.innerHTML = "";
            };
            map.on("movestart zoomstart", hideGallery);

            /* Delegado: la galería se redibuja entera en cada sector. El visor
               recibe TODAS las fotos del barrio, aunque sobre el mapa quepan
               menos polaroids.

               El atributo es `data-bp-gallery-photo` y no `data-bp-photo`:
               ese ya marca los marcos de foto de la página y motion.ts los
               anima con `[data-bp-photo] img`. */
            gallery.addEventListener("click", (event) => {
                const button = (event.target as HTMLElement).closest<HTMLElement>("[data-bp-gallery-photo]");
                if (!button || galleryIndex < 0) return;
                openViewer({
                    photos: photosOf(galleryIndex),
                    index: Number(button.dataset.bpGalleryPhoto),
                    caption: labelOf(galleryIndex),
                    strings,
                    trigger: button,
                });
            });

            const showAll = () => {
                hideCard();
                map.flyToBounds(bounds, { padding: [36, 36], duration: 0.8, animate: !reduceMotion });
            };

            const focusSector = (index: number) => {
                const sector = sectors[index];
                const target = L.latLng(sector.lat, sector.lng);
                /* si ya estamos aterrizados en este sector, mostrar directo:
                   sin movimiento no habría moveend y el once() quedaría colgado */
                if (map.getZoom() === 15 && map.getCenter().distanceTo(target) < 40) {
                    showGallery(index);
                    return;
                }
                /* El oyente va ANTES de mover: con `prefers-reduced-motion` el
                   salto es síncrono y `moveend` se dispara dentro de `flyTo`,
                   así que registrarlo después dejaba la galería sin aparecer
                   —y sin galería no hay manera de abrir el visor—. */
                map.once("moveend", () => showGallery(index));
                map.flyTo(target, 15, { duration: 0.9, animate: !reduceMotion });
            };

            const fitMap = () => {
                map.invalidateSize({ animate: false, pan: false });
                map.fitBounds(bounds, { padding: [36, 36] });
                setState("ready");
            };
            requestAnimationFrame(fitMap);
            window.addEventListener("load", fitMap, { once: true });

            /* Sincronía lista ↔ mapa en ambos sentidos + clic para volar. */
            const items = Array.from(document.querySelectorAll<HTMLElement>("[data-bp-sector]"));
            const pinOf = (index: number) => markers[index]?.getElement()?.querySelector(".bp-pin");
            const activate = (index: number) => {
                const item = items[index];
                if (item) item.dataset.active = "";
                pinOf(index)?.classList.remove(...PIN_IDLE);
                pinOf(index)?.classList.add(...PIN_ACTIVE);
            };
            const deactivate = (index: number) => {
                const item = items[index];
                if (item) delete item.dataset.active;
                pinOf(index)?.classList.remove(...PIN_ACTIVE);
                pinOf(index)?.classList.add(...PIN_IDLE);
            };

            items.forEach((item, index) => {
                const marker = markers[index];
                if (!marker) return;
                item.addEventListener("mouseenter", () => {
                    activate(index);
                    showCard(index);
                });
                item.addEventListener("mouseleave", () => {
                    deactivate(index);
                    hideCard();
                });
                item.addEventListener("focusin", () => {
                    activate(index);
                    showCard(index);
                });
                item.addEventListener("focusout", () => {
                    deactivate(index);
                    hideCard();
                });
                item.addEventListener("click", () => focusSector(index));
            });

            markers.forEach((marker, index) => {
                marker.on("mouseover", () => {
                    activate(index);
                    showCard(index);
                });
                marker.on("mouseout", () => {
                    deactivate(index);
                    hideCard();
                });
                marker.on("click", () => focusSector(index));
            });

            document.querySelectorAll<HTMLElement>("[data-bp-map-reset]").forEach((button) => {
                button.addEventListener("click", showAll);
            });
        } catch (error) {
            console.error("[batucada-map] No se pudo inicializar Leaflet", error);
            setState("error", text(strings.error, { count: sectors.length }));
        }
    };

    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                io.disconnect();
                boot();
            },
            { rootMargin: "600px 0px" },
        );
        io.observe(el);
    } else {
        boot();
    }
};
