/* ──────────────────────────────────────────────────────────────────────────
   Las publicaciones de la colección `posts` convertidas en algo que se pueda
   leer —y rastrear— como una página de novedades.

   Por qué existe: el CMS guarda 43 publicaciones con fecha, texto y enlace al
   original, pero el sitio solo enseñaba ocho, como imágenes en el carrusel de
   la portada. Sin una línea de texto ni una fecha en el HTML, para un buscador
   el sitio no se actualizaba desde 2020. Google lo señaló al revisar la
   activación de Ad Grants: «incluye bastante contenido actualizado».

   Lo que hace este módulo es partir cada pie de foto en titular y cuerpo. No
   se inventa nada: el titular es la primera línea que escribió quien publicó,
   y el cuerpo, el resto. Las etiquetas (#BatucadaPopular…) se separan aparte
   porque un bloque de hashtags al final de un párrafo no es prosa, y dejarlo
   dentro ensucia tanto la lectura como el resumen que muestra el buscador.
─────────────────────────────────────────────────────────────────────────── */
import { getCollection } from "astro:content";

import { strapiMediaSrcSet, strapiMediaUrl } from "./media-url";
import type { Locale } from "../i18n";
import { aTextoPlano } from "./texto-plano";

const STRAPI_URL = import.meta.env.STRAPI_URL ?? "";

/** Largo máximo del titular antes de cortar por la última palabra entera. */
const MAX_TITULAR = 90;

export interface Novedad {
    id: string;
    /** Primera línea del pie, limpia de etiquetas y adornos. */
    titular: string;
    /** El resto del texto, en párrafos, sin el bloque final de etiquetas. */
    parrafos: string[];
    /** Etiquetas del original, sin la almohadilla. */
    etiquetas: string[];
    /** ISO 8601, para el atributo `datetime` de `<time>`. */
    fechaIso: string;
    /** Ya formateada en el idioma de la página. */
    fechaTexto: string;
    /** Enlace a la publicación original. */
    permalink: string;
    tipo: "reel" | "post";
    /* Con medidas: sin `width`/`height` el navegador no reserva el hueco y
       la lista salta mientras cargan las fotos (CLS, que es una de las
       métricas que mira Google). */
    imagen?: { src: string; srcset: string; ancho: number; alto: number };
    /** Solo se enseña cuando hay algo que enseñar; cero no dice nada. */
    meGusta?: number;
}

/**
 * Parte la primera línea del pie en titular y sobrante.
 *
 * Cortar y tirar no vale: la primera línea de una publicación suele ser una
 * frase entera («Así entró Batucadas Populares a la Universidad de Guayaquil,
 * tambor en mano, para poner el ritmo en la Feria Gastronómica…»), y quedarse
 * con los primeros noventa caracteres perdía el final para siempre. Así que lo
 * que no cabe en el titular se devuelve aparte y entra como primer párrafo.
 *
 * El corte busca antes el final de una frase; si no lo hay a mano, la última
 * palabra entera.
 */
const partirTitular = (linea: string): { titular: string; sobrante: string } => {
    const texto = linea
        /* Formato habitual de la cuenta: «#TrabajoDigno🥁 | 1 de mayo…».
           Lo que va antes de la barra es la sección, no el titular. */
        .replace(/^\s*#\S+\s*[|·–—-]\s*/u, "")
        .replace(/^\s*#\S+\s+/u, "")
        .trim();

    /* Una línea que solo son etiquetas no sirve de titular. */
    if (!texto || /^#/.test(texto)) return { titular: "", sobrante: "" };
    if (texto.length <= MAX_TITULAR) return { titular: texto, sobrante: "" };

    const ventana = texto.slice(0, MAX_TITULAR);
    const finDeFrase = Math.max(ventana.lastIndexOf(". "), ventana.lastIndexOf("? "), ventana.lastIndexOf("! "));
    if (finDeFrase > 30) {
        return { titular: texto.slice(0, finDeFrase + 1).trim(), sobrante: texto.slice(finDeFrase + 1).trim() };
    }

    const ultimoEspacio = ventana.lastIndexOf(" ");
    const corte = ultimoEspacio > 40 ? ultimoEspacio : MAX_TITULAR;
    return { titular: `${texto.slice(0, corte).trimEnd()}…`, sobrante: texto.slice(corte).trim() };
};

const partir = (pie: string) => {
    const lineas = aTextoPlano(pie)
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

    const etiquetas = [...aTextoPlano(pie).matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1]);

    /* El cuerpo es todo menos la primera línea y menos las líneas del final
       que sean solo etiquetas. Se recortan por el final para no perder un
       hashtag usado dentro de una frase. */
    const resto = lineas.slice(1);
    while (resto.length > 0) {
        const ultima = resto[resto.length - 1];
        const palabras = ultima.split(/\s+/).filter(Boolean);
        const conAlmohadilla = palabras.filter((p) => p.startsWith("#")).length;
        if (palabras.length > 0 && conAlmohadilla >= Math.max(1, palabras.length - 1)) resto.pop();
        else break;
    }

    return { primera: lineas[0] ?? "", parrafos: resto, etiquetas: [...new Set(etiquetas)] };
};

const formateador = (locale: Locale) =>
    new Intl.DateTimeFormat(locale === "es" ? "es-EC" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

/**
 * Las novedades publicables, de la más reciente a la más antigua.
 *
 * Se descarta lo que no se puede leer: sin pie de foto no hay texto que
 * ofrecer, y sin fecha no hay novedad que fechar. Una tarjeta vacía es peor
 * que una tarjeta que no está.
 */
export async function cargarNovedades(locale: Locale): Promise<Novedad[]> {
    let entradas: Awaited<ReturnType<typeof getCollection>>;
    try {
        entradas = await getCollection("posts");
    } catch (error) {
        /* Igual que el resto del sitio: si el CMS no respondió en build, la
           página se queda vacía pero no tumba la compilación. */
        console.warn("[novedades] No se pudo leer la colección de posts.", error);
        return [];
    }

    const fecha = formateador(locale);

    return entradas
        .map((entrada) => entrada.data as Record<string, unknown>)
        .filter((post) => typeof post.caption === "string" && post.caption.trim() && typeof post.posted_at === "string")
        .map((post) => {
            const { primera, parrafos, etiquetas } = partir(post.caption as string);
            const { titular, sobrante } = partirTitular(primera);
            type Archivo = { url?: string; mime?: string; width?: number; height?: number } | null;
            const esImagenDe = (archivo: Archivo) =>
                Boolean(archivo?.url) && (archivo?.mime ? archivo.mime.startsWith("image/") : !/\.(mp4|webm|mov)$/i.test(archivo?.url ?? ""));
            /* En los reels el vídeo va en `source` y la portada en `poster`. */
            const media = esImagenDe(post.poster as Archivo) ? (post.poster as Archivo) : (post.source as Archivo);
            const fuente = media?.url;
            const esImagen = esImagenDe(media);

            return {
                id: String(post.documentId ?? post.external_id ?? post.permalink),
                /* Sin titular utilizable —una publicación que empieza con un
                   bloque de etiquetas— se asciende el primer párrafo. */
                titular: titular || partirTitular(parrafos[0] ?? "").titular || primera,
                /* `sobrante` es el final de la primera línea cuando no cupo en
                   el titular: abre el cuerpo en lugar de perderse. */
                parrafos: titular ? (sobrante ? [sobrante, ...parrafos] : parrafos) : parrafos.slice(1),
                etiquetas: etiquetas.slice(0, 6),
                fechaIso: post.posted_at as string,
                fechaTexto: fecha.format(new Date(post.posted_at as string)),
                permalink: post.permalink as string,
                tipo: (post.media_kind as "reel" | "post") ?? "post",
                imagen: esImagen
                    ? {
                          src: strapiMediaUrl(fuente, STRAPI_URL, 720),
                          srcset: strapiMediaSrcSet(fuente, STRAPI_URL, [360, 720, 1080]),
                          /* Si el CMS no guardó las medidas se usa 4:5, la
                             proporción con la que publica la cuenta. */
                          ancho: media?.width ?? 1080,
                          alto: media?.height ?? 1350,
                      }
                    : undefined,
                meGusta: typeof post.like_count === "number" && post.like_count > 0 ? post.like_count : undefined,
            } satisfies Novedad;
        })
        .filter((novedad) => novedad.titular.trim().length > 0)
        .sort((a, b) => b.fechaIso.localeCompare(a.fechaIso));
}

/* ── Paginación ──────────────────────────────────────────────────────────
   /novedades crece con cada publicación sincronizada y cada entrada son unos
   2 KB de HTML: sin páginas acaba pasando el presupuesto de
   tests/ad-grants.test.ts. La primera página vive en /novedades (y /en/news);
   las siguientes en /novedades/pagina/<n> (y /en/news/page/<n>). */
export const NOVEDADES_POR_PAGINA = 12;

export const totalPaginas = (novedades: Novedad[]): number => Math.max(1, Math.ceil(novedades.length / NOVEDADES_POR_PAGINA));

export const paginaDe = (novedades: Novedad[], pagina: number): Novedad[] =>
    novedades.slice((pagina - 1) * NOVEDADES_POR_PAGINA, pagina * NOVEDADES_POR_PAGINA);

/** Rutas de las páginas 2…n, para `getStaticPaths`. */
export async function rutasDePaginas(locale: Locale) {
    const novedades = await cargarNovedades(locale);
    const total = totalPaginas(novedades);
    return Array.from({ length: total - 1 }, (_, i) => ({
        params: { pagina: String(i + 2) },
        props: { novedades, pagina: i + 2 },
    }));
}

/** La fecha de la novedad más reciente, para fechar la página entera. */
export const ultimaActualizacion = (novedades: Novedad[]): string | undefined => novedades[0]?.fechaIso;
