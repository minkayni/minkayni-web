/* ──────────────────────────────────────────────────────────────────────────
   Carga de las actividades de campo (colecciones `activities` y
   `activitiesEn`) para /novedades y /novedades/<slug>.

   La lista de rutas la manda el español, como en las subpáginas del
   constructor (src/utils/builder-pages.ts): una actividad sin traducir existe
   igual en inglés y muestra el texto español. El slug es el mismo en los dos
   idiomas, así `/novedades/<slug>` ↔ `/en/news/<slug>` (src/i18n).
─────────────────────────────────────────────────────────────────────────── */
import { getCollection } from "astro:content";
import { getData } from "./i18n";
import { withFallback } from "./content";
import { localizeLinks } from "./localize-links";
import { defaultLocale, type Locale } from "../i18n";
import type { Activity } from "../schemas/pages.zod";
import { actividadesRelacionadas, esPublicable, ordenarActividades, resumirActividad, type ActividadResumen } from "./actividades-core";

const STRAPI_URL = (import.meta.env.STRAPI_URL ?? "").trim();

type Publicable = Activity & { slug: string; title: string; date: string };

const leer = async (name: "activities" | "activitiesEn"): Promise<Activity[]> => {
    try {
        const entries = await getCollection(name as "activities");
        return entries.map((entry) => getData(entry) as Activity);
    } catch (error) {
        console.warn(`[actividades] No se pudo leer ${name}; /novedades sigue solo con las redes.`, error);
        return [];
    }
};

/** Las actividades publicadas en el idioma pedido (con respaldo en español). */
export async function cargarActividadesCompletas(locale: Locale): Promise<Publicable[]> {
    const espanol = (await leer("activities")).filter((a) => esPublicable(a) && Boolean(a.publishedAt)) as Publicable[];
    if (locale === defaultLocale) return espanol;

    const traducidas = new Map((await leer("activitiesEn")).map((a) => [a.documentId, a]));
    return espanol.map((actividad) => {
        const traduccion = actividad.documentId ? traducidas.get(actividad.documentId) : undefined;
        /* El slug manda el español aunque la traducción tenga otro. */
        const unida = traduccion ? { ...withFallback(actividad, traduccion), slug: actividad.slug } : actividad;
        return localizeLinks(unida, locale) as Publicable;
    });
}

export async function cargarActividades(locale: Locale): Promise<ActividadResumen[]> {
    const completas = await cargarActividadesCompletas(locale);
    return ordenarActividades(completas.map((a) => resumirActividad(a, locale, STRAPI_URL)));
}

const vecina = (resumen?: ActividadResumen) => (resumen ? { slug: resumen.slug, titulo: resumen.titulo } : undefined);

/** Rutas de /novedades/<slug> (y /en/news/<slug>). */
export async function rutasDeActividades(locale: Locale) {
    const completas = await cargarActividadesCompletas(locale);
    const resumenes = ordenarActividades(completas.map((a) => ({ ...resumirActividad(a, locale, STRAPI_URL), completa: a })));
    const sinCompleta = resumenes.map(({ completa: _, ...resumen }) => resumen);
    return resumenes.map(({ completa, ...resumen }, indice) => ({
        params: { slug: resumen.slug },
        props: {
            actividad: completa,
            resumen,
            /* Para «Siguiente / anterior» al pie de la actividad. */
            anterior: vecina(resumenes[indice + 1]),
            siguiente: vecina(resumenes[indice - 1]),
            relacionadas: actividadesRelacionadas(sinCompleta, resumen),
        },
    }));
}
