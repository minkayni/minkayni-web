const RASTER_IMAGE = /\.(?:jpe?g|png|webp|avif|gif)$/i;
/* Formatos que conviene pedir convertidos a WebP (`?f=webp`, ver el proxy
   de medios del CMS). Las fotos se suben como JPEG o PNG —las del equipo son
   PNG de 400-500 KB— y PageSpeed las marca en cada análisis. WebP y AVIF ya
   son modernos; un GIF perdería la animación. */
const CONVERT_TO_WEBP = /\.(?:jpe?g|png)$/i;
const LEGACY_MEDIA_HOSTS = new Set(["img.minkayni.org"]);

/* Origen público de los medios. Los ficheros del CMS se sirven desde el
   propio dominio de la web, en `/media/<archivo>`: Nginx (ver nginx.conf)
   reenvía esa ruta a `<STRAPI_URL>/media/uploads/<archivo>` y la guarda en
   caché, así el visitante —y los proxies de imágenes de Gmail, WhatsApp o
   Google— solo ven `www.minkayni.org`, y el `uploads/` (la carpeta interna
   del almacén de Strapi) no aparece en ninguna URL pública. Es absoluta y no relativa para que sirva igual en
   `og:image`, JSON-LD y en `astro dev`, donde no hay proxy delante.
   `PUBLIC_MEDIA_ORIGIN` permite apuntar a otro sitio (p. ej. un entorno de
   pruebas) sin tocar el código. */
const MEDIA_ORIGIN_DEFAULT = "https://www.minkayni.org";
export function mediaOrigin(): string {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
    const configured = env.PUBLIC_MEDIA_ORIGIN ?? (typeof process !== "undefined" ? process.env.PUBLIC_MEDIA_ORIGIN : undefined);
    try {
        return new URL(configured || MEDIA_ORIGIN_DEFAULT).origin;
    } catch {
        return MEDIA_ORIGIN_DEFAULT;
    }
}

function decodedSegment(segment: string): string | null {
    try {
        return decodeURIComponent(segment);
    } catch {
        return null;
    }
}

function isUnsafeSegment(segment: string): boolean {
    let candidate = segment;

    for (let depth = 0; depth < 4; depth += 1) {
        const decoded = decodedSegment(candidate);
        if (decoded === null) return true;
        if (decoded === "." || decoded === ".." || decoded.includes("/") || decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) return true;
        if (decoded === candidate) return false;
        candidate = decoded;
    }

    return decodedSegment(candidate) !== candidate;
}

function hasTraversal(src: string): boolean {
    const rawPath = src.replace(/^(?:https?:)?\/\/[^/]+/i, "").split(/[?#]/, 1)[0];

    return rawPath.split("/").some(isUnsafeSegment);
}

function encodedKey(rawKey: string): string | null {
    const segments = rawKey.split("/");
    if (segments.some((segment) => !segment)) return null;

    const encoded: string[] = [];
    for (const segment of segments) {
        if (isUnsafeSegment(segment)) return null;
        const decoded = decodedSegment(segment);
        if (decoded === null) return null;
        encoded.push(encodeURIComponent(decoded));
    }

    return encoded.join("/");
}

function mediaKey(pathname: string): string | null {
    const routes: RegExp[] = [/^\/media\/(.+)$/, /^\/api\/imagor\/(.+)$/, /^\/api\/media\/(.+)$/, /^\/img\/(?:original|\d+)\/(.+)$/, /^\/(?:raw|doc)\/(.+)$/];

    for (const route of routes) {
        const match = pathname.match(route);
        if (match) return encodedKey(match[1]);
    }

    const upload = pathname.match(/^\/uploads\/(.+)$/);
    return upload ? encodedKey(`uploads/${upload[1]}`) : null;
}

function normalizedBase(strapiBase: string): string {
    try {
        return new URL(strapiBase).origin;
    } catch {
        return "";
    }
}

function isRecognizedOrigin(src: string, sourceUrl: URL, base: string): boolean {
    const isAbsolute = /^(?:https?:)?\/\//i.test(src);
    return !isAbsolute || sourceUrl.origin === base || sourceUrl.origin === mediaOrigin() || LEGACY_MEDIA_HOSTS.has(sourceUrl.hostname.toLowerCase());
}

/* Versión del recorte que hay detrás de `?w=`. Cloudflare, el Nginx de la web
   y el navegador guardan cada URL treinta días como `immutable`: si el CDN
   cambia lo que devuelve para el mismo `?w=`, solo una URL nueva lo hace
   visible. v2: `w` acota solo el ancho (antes, un cuadrado de w×w, y una foto
   vertical pedida a 640 llegaba con 427 px de ancho). */
const MEDIA_TRANSFORM_VERSION = 2;

export function strapiMediaUrl(src: string | null | undefined, strapiBase: string, width = 0): string {
    if (!src) return "";
    if (hasTraversal(src)) return "";

    const base = normalizedBase(strapiBase);
    if (!base) return "";

    let sourceUrl: URL;
    try {
        sourceUrl = new URL(src, base);
    } catch {
        return "";
    }

    if (sourceUrl.protocol !== "http:" && sourceUrl.protocol !== "https:") return "";

    if (!isRecognizedOrigin(src, sourceUrl, base)) return src;

    const key = mediaKey(sourceUrl.pathname);
    if (!key) return src;

    // La clave canónica del CMS es `uploads/<archivo>`; en público va sin el prefijo.
    const url = `${mediaOrigin()}/media/${key.replace(/^uploads\//, "")}`;
    const safeWidth = Math.min(Math.max(Math.trunc(width), 16), 3840);
    if (!(width > 0 && RASTER_IMAGE.test(key))) return url;
    const format = CONVERT_TO_WEBP.test(key) ? "&f=webp" : "";
    return `${url}?w=${safeWidth}${format}&v=${MEDIA_TRANSFORM_VERSION}`;
}

/** `srcset` del proxy de medios. Con `intrinsicWidth` (el `width` del archivo
 *  en Strapi) no anuncia anchos que el original no tiene: el CDN nunca amplía,
 *  y un `1600w` que en realidad mide 1080 hace que el navegador lo estire. */
export function strapiMediaSrcSet(src: string | null | undefined, strapiBase: string, widths: readonly number[], intrinsicWidth?: number | null): string {
    const original = strapiMediaUrl(src, strapiBase);
    if (!original.startsWith(`${mediaOrigin()}/media/`)) return "";
    if (!RASTER_IMAGE.test(new URL(original).pathname)) return "";

    const cap = intrinsicWidth && intrinsicWidth >= 16 ? Math.trunc(intrinsicWidth) : Infinity;
    return [...new Set(widths.map((width) => Math.min(width, cap)))]
        .filter((width) => Number.isInteger(width) && width >= 16 && width <= 3840)
        .sort((a, b) => a - b)
        .map((width) => `${strapiMediaUrl(src, strapiBase, width)} ${width}w`)
        .join(", ");
}

/** Cuánto más ancha se pinta una foto con `object-cover` que su caja. Si la
 *  foto es más apaisada que la caja, `cover` la ajusta por el alto y se sale
 *  por los lados: una foto 3:2 en una caja cuadrada de 500 px se pinta a
 *  750 px de ancho, y un `sizes` de 500px pediría una versión pequeña. */
export function coverScale(boxRatio: number, media?: { width?: number | null; height?: number | null } | null): number {
    const { width, height } = media ?? {};
    if (!width || !height || !(boxRatio > 0)) return 1;
    return Math.max(1, width / height / boxRatio);
}

/* GIF transparente de 1×1 para el `src` de las imágenes que se piden después
   del LCP (`data-lcp-src`, ver layouts/lib/head.astro): sin `src` el <img>
   pinta su `alt` como texto hasta que llega la URL. */
export const PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
