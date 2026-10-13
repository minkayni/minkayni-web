/* Sección «isla»: el bloque redondeado a casi todo el ancho (94 %, máx.
   1440 px) que se repite en las páginas interiores y en el constructor. Es
   una función y no solo un componente para que la compartan SectionIsland.astro
   y los bloques React del constructor (BuilderBlocks.tsx). */

const BASE = "rounded-[2.75rem] lg:rounded-[5rem]";

const WIDTHS = {
    /** A casi todo el ancho de la página. */
    page: "mx-auto w-[94%] max-w-[1440px]",
    /** Dentro de una columna que ya pone su ancho (el cuerpo de una actividad). */
    full: "w-full",
} as const;

const TONES = {
    /** Piedra cálida, texto por defecto. */
    surface: "bg-surface",
    /** Degradado morado de marca, texto crema. */
    brand: "bg-brand-gradient text-white",
    /** Ámbar, para las llamadas a la acción. */
    accent: "bg-accent text-black",
} as const;

const PADDINGS = {
    /** Contenido denso: líneas de tiempo, listados. */
    compact: "px-4 py-14 sm:px-8 lg:px-14 lg:py-20",
    /** Secciones de lectura con más aire. */
    wide: "px-6 py-16 sm:px-12 lg:px-20 lg:py-24",
    /** Llamadas a la acción: igual de anchas, algo más bajas en escritorio. */
    cta: "px-6 py-16 sm:px-12 lg:px-20 lg:py-20",
    /** El relleno lo pone quien la usa. */
    none: "",
} as const;

export type IslandTone = keyof typeof TONES;
export type IslandPadding = keyof typeof PADDINGS;

const DEFAULT_PADDING: Record<IslandTone, IslandPadding> = { surface: "compact", brand: "wide", accent: "wide" };

export type IslandWidth = keyof typeof WIDTHS;

export const islandClass = (tone: IslandTone, padding: IslandPadding = DEFAULT_PADDING[tone], extra = "", width: IslandWidth = "page"): string =>
    [WIDTHS[width], BASE, TONES[tone], PADDINGS[padding], extra].filter(Boolean).join(" ");
