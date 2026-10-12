/* ──────────────────────────────────────────────────────────────────────────
   Fotos de un sector del mapa de Batucada, listas para el navegador.

   El componente Sector de Strapi tiene un campo `photos`; esta función lo
   traduce a lo que necesitan la polaroid del mapa (una miniatura) y el visor
   a pantalla completa (la grande, con candidatas por ancho de pantalla).
   Todo pasa por el proxy /media, como el resto de imágenes del CMS.

   Mientras un barrio no tenga fotos propias se usan las genéricas del
   proyecto, que viven en /public y no dependen del CMS. */
import { strapiMediaUrl, strapiMediaSrcSet } from "./media-url";

export type ViewerPhoto = {
    /** Miniatura de la tira del visor: se pinta a 80 px. */
    strip: string;
    /** Versión pequeña: la polaroid sobre el mapa. */
    thumb: string;
    /** Versión grande: la del visor. */
    full: string;
    /** Versión de resolución alta, solo al ampliar. */
    zoom: string;
    /** Candidatas del visor; vacío en las genéricas, que tienen un solo tamaño. */
    srcset: string;
    alt: string;
    /** Leyenda que escribe quien sube la foto (campo Caption de Strapi). */
    caption?: string;
    width?: number;
    height?: number;
};

type CmsPhoto =
    | {
          url?: string | null;
          alternativeText?: string | null;
          caption?: string | null;
          width?: number | null;
          height?: number | null;
      }
    | null
    | undefined;

/* Cuatro tamaños, uno por sitio donde se ve la foto. Los sirve Imagor a
   través del proxy /media (`?w=…&f=webp`), así que pedir un tamaño de más no
   cuesta un archivo nuevo en el repositorio, pero sí bytes en el teléfono de
   quien mira: de ahí que la tira pida 160 px y no los 1600 de la grande. */
const STRIP_WIDTH = 160;
const THUMB_WIDTH = 480;
const FULL_WIDTH = 1600;
const VIEWER_WIDTHS = [640, 960, 1280, 1600];

/** Tope por sector: el visor es una galería corta, no un archivo fotográfico. */
export const MAX_SECTOR_PHOTOS = 8;

/** Las tres fotos del proyecto que sirven a cualquier sector sin fotos propias. */
export const genericSectorPhotos = (alt: string): ViewerPhoto[] =>
    [1, 2, 3].map((n) => ({
        strip: `/batucada/hover-${n}.webp`,
        thumb: `/batucada/hover-${n}.webp`,
        full: `/batucada/hover-${n}.webp`,
        zoom: `/batucada/hover-${n}.webp`,
        srcset: "",
        alt,
        width: 400,
        height: 240,
    }));

/**
 * Fotos de un sector, o las genéricas si aún no tiene las suyas.
 *
 * @param photos     Campo `photos` del sector tal y como llega de Strapi.
 * @param strapiBase Origen del CMS (`STRAPI_URL`), que resuelve las rutas.
 * @param alt        Texto alternativo de respaldo, ya traducido, para las
 *                   fotos que el CMS no describa.
 * @param max        Tope de fotos (el mapa usa 8; la galería de una actividad, más).
 */
export function sectorPhotos(photos: readonly CmsPhoto[] | null | undefined, strapiBase: string, alt: string, max = MAX_SECTOR_PHOTOS): ViewerPhoto[] {
    const resolved: ViewerPhoto[] = [];

    for (const photo of photos ?? []) {
        if (resolved.length >= max) break;
        const url = photo?.url ?? "";
        if (!url) continue;

        const full = strapiMediaUrl(url, strapiBase, FULL_WIDTH);
        const thumb = strapiMediaUrl(url, strapiBase, THUMB_WIDTH);
        /* Una URL que el proxy no reconoce (otro dominio, ruta con `..`)
           devuelve cadena vacía: esa foto no se publica. */
        if (!full || !thumb) continue;

        resolved.push({
            strip: strapiMediaUrl(url, strapiBase, STRIP_WIDTH),
            thumb,
            full,
            /* Sin ancho: el proxy sirve el archivo tal y como se subió. Solo
               se pide al ampliar (ver viewer.ts), así que la foto original
               —varios megas si viene de un teléfono— no la paga quien pasa
               de largo. */
            zoom: strapiMediaUrl(url, strapiBase),
            srcset: strapiMediaSrcSet(url, strapiBase, VIEWER_WIDTHS, photo?.width),
            alt: photo?.alternativeText?.trim() || alt,
            /* La leyenda es el campo Caption del archivo, en la biblioteca de
               medios: se escribe una vez y vale allá donde se use esa foto.
               Leyenda y texto alternativo no son lo mismo: el alternativo
               describe la foto a quien no la ve, la leyenda la cuenta a todo
               el mundo. Por eso no se copia el uno en el otro. */
            caption: photo?.caption?.trim() || undefined,
            width: photo?.width ?? undefined,
            height: photo?.height ?? undefined,
        });
    }

    return resolved.length ? resolved : genericSectorPhotos(alt);
}
