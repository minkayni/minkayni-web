/* ──────────────────────────────────────────────────────────────────────────
   Bloques del constructor de subpáginas: forma canónica.

   El mismo contenido llega con dos formas distintas:
   - En build, por GraphQL: cada bloque trae `__typename` (ComponentBlocksIntro…)
     y los campos con alias únicos por fragmento (introHeading, gridCards,
     allyItems…), porque una unión de GraphQL no admite el mismo nombre con
     tipos distintos.
   - En la vista previa, por la API de documentos de Strapi: `__component`
     (blocks.intro…) y los campos con su nombre de verdad (heading, cards…).

   Aquí las dos se reducen a una sola, que es la que pinta BuilderBlocks.tsx.
   Un bloque desconocido se descarta sin romper la página.
─────────────────────────────────────────────────────────────────────────── */

export type Heading = { eyebrow?: string | null; title?: string | null; body?: string | null } | null;
export type Media = { url?: string | null; alternativeText?: string | null; caption?: string | null; width?: number | null; height?: number | null; mime?: string | null } | null;
export type Stat = { value?: string | null; target?: number | null; prefix?: string | null; suffix?: string | null; label?: string | null; detail?: string | null };
export type Card = { title?: string | null; description?: string | null };
export type TimelineItem = { chip?: string | null; period?: string | null; title?: string | null; text?: string | null; image?: Media; imageAlt?: string | null };
export type Award = { year?: string | null; org?: string | null; title?: string | null; text?: string | null; href?: string | null; linkText?: string | null };
export type PressItem = { outlet?: string | null; year?: string | null; title?: string | null; href?: string | null };
export type LinkCard = { eyebrow?: string | null; title?: string | null; text?: string | null; href?: string | null; linkText?: string | null; external?: boolean | null };
export type Link = { text?: string | null; href?: string | null } | null;
export type ActionButton = { href?: string | null; defaultText?: string | null; hoverText?: string | null } | null;

export type Block =
    | { type: "intro"; heading: Heading }
    /** `bodyHtml` lo rellena quien renderiza: en build, el pipeline Markdown
        del sitio; en la vista previa, un renderizador ligero en el navegador. */
    | { type: "richText"; body: string | null; bodyHtml?: string }
    | { type: "media"; image: Media; caption: string | null }
    | { type: "quote"; text: string | null; cite: string | null }
    | { type: "stats"; heading: Heading; stats: Stat[] }
    | { type: "cardGrid"; heading: Heading; cards: Card[] }
    | { type: "timeline"; heading: Heading; items: TimelineItem[] }
    | { type: "awards"; heading: Heading; awards: Award[]; note: string | null }
    | { type: "pressList"; heading: Heading; items: PressItem[] }
    | { type: "linkCards"; heading: Heading; cards: LinkCard[] }
    | { type: "allies"; heading: Heading; items: Array<{ text?: string | null }> }
    | { type: "cta"; heading: Heading; button: ActionButton; secondary: Link }
    | { type: "gallery"; heading: Heading; images: Media[]; caption: string | null }
    /** `url`: YouTube o Vimeo; `file`: vídeo subido. Basta con uno. */
    | { type: "video"; url: string | null; file: Media; caption: string | null }
    | { type: "mediaText"; heading: Heading; body: string | null; bodyHtml?: string; image: Media; caption: string | null; imagePosition: "left" | "right" }
    | { type: "faq"; heading: Heading; items: Array<{ question: string; answer: string }> };

export type BlockType = Block["type"];

const TYPE_BY_NAME: Record<string, BlockType> = {
    ComponentBlocksIntro: "intro",
    ComponentBlocksRichText: "richText",
    ComponentBlocksMedia: "media",
    ComponentBlocksQuote: "quote",
    ComponentBlocksStats: "stats",
    ComponentBlocksCardGrid: "cardGrid",
    ComponentBlocksTimeline: "timeline",
    ComponentBlocksAwards: "awards",
    ComponentBlocksPressList: "pressList",
    ComponentBlocksLinkCards: "linkCards",
    ComponentBlocksAllies: "allies",
    ComponentBlocksCta: "cta",
    ComponentBlocksGallery: "gallery",
    ComponentBlocksVideo: "video",
    ComponentBlocksMediaText: "mediaText",
    ComponentBlocksFaq: "faq",
    "blocks.intro": "intro",
    "blocks.rich-text": "richText",
    "blocks.media": "media",
    "blocks.quote": "quote",
    "blocks.stats": "stats",
    "blocks.card-grid": "cardGrid",
    "blocks.timeline": "timeline",
    "blocks.awards": "awards",
    "blocks.press-list": "pressList",
    "blocks.link-cards": "linkCards",
    "blocks.allies": "allies",
    "blocks.cta": "cta",
    "blocks.gallery": "gallery",
    "blocks.video": "video",
    "blocks.media-text": "mediaText",
    "blocks.faq": "faq",
};

type Raw = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const obj = (v: unknown): Raw | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : null);
const list = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter((x): x is Raw => Boolean(obj(x))) : []);
/** Primer campo presente entre el nombre real y sus alias de GraphQL. */
const pick = (raw: Raw, ...names: string[]): unknown => names.map((n) => raw[n]).find((v) => v !== undefined && v !== null);

const heading = (v: unknown): Heading => {
    const h = obj(v);
    return h ? { eyebrow: str(h.eyebrow), title: str(h.title), body: str(h.body) } : null;
};
const media = (v: unknown): Media => {
    const m = obj(v);
    return m && str(m.url) ? { url: str(m.url), alternativeText: str(m.alternativeText), caption: str(m.caption), width: num(m.width), height: num(m.height), mime: str(m.mime) } : null;
};
const link = (v: unknown): Link => {
    const l = obj(v);
    return l ? { text: str(l.text), href: str(l.href) } : null;
};

export function normalizeBlock(raw: unknown): Block | null {
    const r = obj(raw);
    if (!r) return null;
    const name = str(r.__typename) ?? str(r.__component) ?? "";
    const type = TYPE_BY_NAME[name];
    if (!type) return null;

    const h = heading(pick(r, "heading", "introHeading", "statsHeading", "gridHeading", "timelineHeading", "awardsHeading", "pressHeading", "linksHeading", "alliesHeading", "ctaHeading", "galleryHeading", "mediaTextHeading", "faqHeading"));

    switch (type) {
        case "intro":
            return { type, heading: h };
        case "richText":
            return { type, body: str(r.body) };
        case "media":
            return { type, image: media(r.image), caption: str(r.caption) };
        case "quote":
            return { type, text: str(r.text), cite: str(r.cite) };
        case "stats":
            return {
                type,
                heading: h,
                stats: list(r.stats).map((s) => ({ value: str(s.value), target: num(s.target), prefix: str(s.prefix), suffix: str(s.suffix), label: str(s.label), detail: str(s.detail) })),
            };
        case "cardGrid":
            return { type, heading: h, cards: list(pick(r, "cards", "gridCards")).map((c) => ({ title: str(c.title), description: str(c.description) })) };
        case "timeline":
            return {
                type,
                heading: h,
                items: list(pick(r, "items", "timelineItems")).map((i) => ({ chip: str(i.chip), period: str(i.period), title: str(i.title), text: str(i.text), image: media(i.image), imageAlt: str(i.imageAlt) })),
            };
        case "awards":
            return {
                type,
                heading: h,
                awards: list(r.awards).map((a) => ({ year: str(a.year), org: str(a.org), title: str(a.title), text: str(a.text), href: str(a.href), linkText: str(a.linkText) })),
                note: str(r.note),
            };
        case "pressList":
            return { type, heading: h, items: list(pick(r, "items", "pressItems")).map((p) => ({ outlet: str(p.outlet), year: str(p.year), title: str(p.title), href: str(p.href) })) };
        case "linkCards":
            return {
                type,
                heading: h,
                cards: list(pick(r, "cards", "linkCards")).map((c) => ({ eyebrow: str(c.eyebrow), title: str(c.title), text: str(c.text), href: str(c.href), linkText: str(c.linkText), external: bool(c.external) })),
            };
        case "allies":
            return { type, heading: h, items: list(pick(r, "items", "allyItems")).map((i) => ({ text: str(i.text) })) };
        case "cta": {
            const b = obj(r.button);
            return { type, heading: h, button: b ? { href: str(b.href), defaultText: str(b.defaultText), hoverText: str(b.hoverText) } : null, secondary: link(r.secondary) };
        }
        case "gallery":
            return { type, heading: h, images: list(pick(r, "images", "galleryImages")).map(media).filter(Boolean), caption: str(pick(r, "caption", "galleryCaption")) };
        case "video":
            return { type, url: str(pick(r, "url", "videoUrl")), file: media(pick(r, "file", "videoFile")), caption: str(pick(r, "caption", "videoCaption")) };
        case "mediaText":
            return {
                type,
                heading: h,
                body: str(pick(r, "body", "mediaTextBody")),
                image: media(pick(r, "image", "mediaTextImage")),
                caption: str(pick(r, "caption", "mediaTextCaption")),
                imagePosition: r.imagePosition === "right" ? "right" : "left",
            };
        case "faq":
            return {
                type,
                heading: h,
                items: list(pick(r, "items", "faqItems"))
                    .map((i) => ({ question: str(i.question)?.trim() ?? "", answer: str(i.answer)?.trim() ?? "" }))
                    .filter((i) => i.question && i.answer),
            };
    }
}

export function normalizeBlocks(raw: unknown): Block[] {
    return (Array.isArray(raw) ? raw : []).map(normalizeBlock).filter((b): b is Block => b !== null);
}

/** URL de todas las fotos que pintan los bloques (imagen, foto y texto,
 *  galería): la galería del final de una actividad no las repite. */
export const blockImageUrls = (blocks: Block[]): string[] =>
    blocks
        .flatMap((block) => (block.type === "media" || block.type === "mediaText" ? [block.image] : block.type === "gallery" ? block.images : []))
        .map((media) => media?.url)
        .filter((url): url is string => Boolean(url));

/**
 * Convierte a HTML el Markdown de los bloques que lo llevan (texto y foto
 * con texto). Quien llama pone el conversor: en build, el pipeline del
 * sitio; en la vista previa, el del navegador.
 */
export async function renderBlocksMarkdown(blocks: Block[], render: (markdown: string) => string | Promise<string>): Promise<Block[]> {
    return Promise.all(blocks.map(async (block) => ((block.type === "richText" || block.type === "mediaText") && block.body ? { ...block, bodyHtml: await render(block.body) } : block)));
}
