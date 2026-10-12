/* ──────────────────────────────────────────────────────────────────────────
   Actividades de campo convertidas en lo que pintan /novedades y
   /novedades/<slug>. Sin `astro:content` a propósito: las pruebas
   (tests/actividades.test.ts) lo importan directamente.

   Las actividades las crea el Reportero de campo del CMS (el equipo cuenta
   la actividad a Claude, Claude la redacta y la coordinación la aprueba), o
   una persona a mano en Strapi → Actividades. No se inventa nada aquí: solo
   se ordena, se fecha y se resuelven las URLs de medios.
─────────────────────────────────────────────────────────────────────────── */
import type { Activity } from "../schemas/pages.zod";
import type { Locale } from "../i18n";
import { strapiMediaSrcSet, strapiMediaUrl } from "./media-url";

export type Marca = "minkayni" | "batucada";

export interface ImagenActividad {
    src: string;
    srcset: string;
    ancho: number;
    alto: number;
    alt: string;
}

export interface ActividadResumen {
    slug: string;
    titulo: string;
    resumen: string;
    marca: Marca;
    proyecto?: string;
    lugar?: string;
    /** AAAA-MM-DD. */
    fechaIso: string;
    anio: string;
    /** «20 de septiembre de 2026» o «20–21 de septiembre de 2026». */
    fechaTexto: string;
    portada?: ImagenActividad;
    destacada: boolean;
    etiquetas: string[];
}

const esFecha = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value);

/* Las fechas de Strapi (`date`) no tienen hora: se leen en UTC para que el
   día no se corra según la zona horaria de quien construye el sitio. */
const aFecha = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);

export function formatearFechas(inicio: string, fin: string | null | undefined, locale: Locale): string {
    const opciones: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" };
    const formato = new Intl.DateTimeFormat(locale === "es" ? "es-EC" : "en-GB", opciones);
    if (!esFecha(fin) || fin.slice(0, 10) === inicio.slice(0, 10)) return formato.format(aFecha(inicio));
    return formato.formatRange(aFecha(inicio), aFecha(fin));
}

type Media = { url?: string | null; width?: number | null; height?: number | null; alternativeText?: string | null; mime?: string | null } | null | undefined;

export const esImagen = (media: Media): boolean =>
    Boolean(media?.url) && (media?.mime ? media.mime.startsWith("image/") : !/\.(mp4|webm|mov)$/i.test(media?.url ?? ""));

export function imagenDe(media: Media, strapiBase: string, altRespaldo: string, anchos: readonly number[] = [480, 960, 1600, 2200]): ImagenActividad | undefined {
    if (!esImagen(media)) return undefined;
    const src = strapiMediaUrl(media?.url, strapiBase, anchos[anchos.length - 1]);
    if (!src) return undefined;
    return {
        src,
        srcset: strapiMediaSrcSet(media?.url, strapiBase, anchos, media?.width),
        ancho: media?.width ?? 1600,
        alto: media?.height ?? 1200,
        alt: media?.alternativeText?.trim() || altRespaldo,
    };
}

/** Solo lo publicable: con slug, título y fecha. */
export const esPublicable = (actividad: Activity): actividad is Activity & { slug: string; title: string; date: string } =>
    Boolean(actividad?.slug?.trim() && actividad.title?.trim() && esFecha(actividad.date));

export function resumirActividad(actividad: Activity & { slug: string; title: string; date: string }, locale: Locale, strapiBase: string): ActividadResumen {
    const fechaIso = actividad.date.slice(0, 10);
    return {
        slug: actividad.slug.trim(),
        titulo: actividad.title.trim(),
        resumen: actividad.summary?.trim() ?? "",
        marca: actividad.brand === "batucada" ? "batucada" : "minkayni",
        proyecto: actividad.project?.trim() || undefined,
        lugar: actividad.place_name?.trim() || undefined,
        fechaIso,
        anio: fechaIso.slice(0, 4),
        fechaTexto: formatearFechas(fechaIso, actividad.end_date, locale),
        portada: imagenDe(actividad.cover, strapiBase, actividad.title.trim(), [480, 960, 1440]),
        destacada: actividad.is_featured === true,
        etiquetas: (actividad.tags ?? []).filter((t): t is string => typeof t === "string" && t.trim().length > 0).slice(0, 6),
    };
}

/** De la más reciente a la más antigua; a igual fecha, las destacadas primero. */
export const ordenarActividades = <T extends Pick<ActividadResumen, "fechaIso" | "destacada" | "titulo">>(lista: T[]): T[] =>
    [...lista].sort((a, b) => b.fechaIso.localeCompare(a.fechaIso) || Number(b.destacada) - Number(a.destacada) || a.titulo.localeCompare(b.titulo));

/** La destacada más reciente o, si no hay, la más reciente. */
export const actividadPrincipal = <T extends Pick<ActividadResumen, "destacada">>(ordenadas: T[]): T | undefined =>
    ordenadas.find((a) => a.destacada) ?? ordenadas[0];

/** Años con actividades, del más reciente al más antiguo. */
export const aniosDe = (lista: Pick<ActividadResumen, "anio">[]): string[] => [...new Set(lista.map((a) => a.anio))].sort((a, b) => b.localeCompare(a));

/** Marcas presentes, en orden fijo. */
export const marcasDe = (lista: Pick<ActividadResumen, "marca">[]): Marca[] => (["minkayni", "batucada"] as const).filter((m) => lista.some((a) => a.marca === m));

/** Enlace a OpenStreetMap para «Ver en el mapa». */
export const enlaceMapa = (lat: number | null | undefined, lng: number | null | undefined): string | undefined =>
    Number.isFinite(lat) && Number.isFinite(lng) ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}` : undefined;
