/* ──────────────────────────────────────────────────────────────────────────
   BuilderBlocks — el renderizador de las subpáginas del constructor.

   Es React, y no Astro, por una razón concreta: tiene que correr en dos
   sitios. En build, Astro lo renderiza a HTML estático para las páginas
   publicadas (sin `client:*`, así que no envía JavaScript). En la vista
   previa del panel de Strapi corre en el navegador sobre el borrador recién
   pedido al CMS. Un solo renderizador para los dos caminos: lo que el editor
   ve en la vista previa es exactamente lo que saldrá al publicar.

   Cada bloque reproduce una sección ya existente del sitio (el intro de
   /about, las cifras de /impact, las alianzas de /projects…) con las mismas
   clases. Los atributos `data-reveal`, `data-scroll-float` y `data-count`
   los recogen los mismos scripts e islas que en el resto de páginas.
─────────────────────────────────────────────────────────────────────────── */
import { formatTitle } from "@/utils/rich-title";
import { strapiMediaSrcSet, strapiMediaUrl } from "@/utils/media-url";
import { islandClass } from "../../section-island";
import type { Block, Heading, Media } from "./normalize";

interface Props {
    blocks: Block[];
    /** Base del CMS para resolver las URL de los medios (STRAPI_URL). */
    strapiUrl: string;
}

const isExternal = (href?: string | null) => Boolean(href && /^https?:\/\//.test(href));

/* Un título del CMS: `*acento*` y saltos de línea, ya escapado por formatTitle. */
const Title = ({ title, className, accent = "" }: { title: string; className: string; accent?: string }) => (
    <h2 data-scroll-float className={className} dangerouslySetInnerHTML={{ __html: formatTitle(title, accent) }} />
);

/* Imagen del CMS por el proxy /media con srcset, como CmsImage.astro (sin la
   parte de respaldo local, que aquí no aplica: todo viene del CMS). */
const CmsPicture = ({ media, alt, widths, sizes, className, strapiUrl }: { media: Media; alt: string; widths: number[]; sizes: string; className: string; strapiUrl: string }) => {
    const url = media?.url ?? "";
    if (!url) return null;
    const srcSet = strapiMediaSrcSet(url, strapiUrl, widths);
    return (
        <img
            src={strapiMediaUrl(url, strapiUrl, widths[widths.length - 1])}
            srcSet={srcSet || undefined}
            sizes={srcSet ? sizes : undefined}
            alt={alt || media?.alternativeText || ""}
            className={className}
            width={media?.width ?? undefined}
            height={media?.height ?? undefined}
            loading="lazy"
            decoding="async"
        />
    );
};

/* El botón «mágico» del sitio (Button.astro), mismo marcado y mismos
   `data-role`: lo anima src/scripts/magic-button.ts y lo viste el CSS global. */
export const MagicButton = ({ href, defaultText, hoverText }: { href: string; defaultText: string; hoverText: string }) => (
    <a href={href} data-magic-btn className="magic-btn animate relative inline-block isolate select-none uppercase font-medium rounded-full font-display" aria-label={defaultText}>
        <span data-role="bg-fill" className="absolute inset-0 -z-10 rounded-full" style={{ background: "var(--btn-bg)", borderRadius: "var(--btn-radius)" }} />
        <span className="relative block overflow-hidden p-[1px] rounded-full">
            <span data-role="glow-inner" className="glow-inner absolute inset-[4px] rounded-full will-animate pointer-events-none" />
            <span data-role="btn-surface" className="relative z-10 block rounded-full" style={{ background: "var(--btn-bg)", borderRadius: "var(--btn-radius)" }}>
                <span data-role="label-wrap" className="relative inline-grid place-items-center text-center overflow-hidden text-[var(--btn-text)] px-[var(--btn-px)] py-[var(--btn-py)] whitespace-nowrap [font-size:var(--btn-text-size)]">
                    <span data-role="label-default" className="[grid-area:1/1] gap-1 flex items-center justify-center will-change-transform">
                        {defaultText}
                    </span>
                    <span data-role="label-hover" className="[grid-area:1/1] gap-1 flex items-center justify-center will-change-transform">
                        {hoverText}
                    </span>
                </span>
            </span>
        </span>
        <span data-role="glow-outer" className="glow-outer absolute inset-0 -z-20 rounded-full will-animate" />
    </a>
);

/* Cabecera de sección compartida por casi todos los bloques. */
const SectionHeading = ({ heading, eyebrowClass, titleClass, bodyClass, accent, className }: { heading: Heading; eyebrowClass: string; titleClass: string; bodyClass: string; accent?: string; className: string }) => {
    if (!heading || (!heading.eyebrow && !heading.title)) return null;
    return (
        <div className={className} data-reveal>
            {heading.eyebrow && <p className={eyebrowClass}>{heading.eyebrow}</p>}
            {heading.title && <Title title={heading.title} className={titleClass} accent={accent} />}
            {heading.body && <p className={bodyClass}>{heading.body}</p>}
        </div>
    );
};

const EYEBROW = "mb-4 text-sm font-bold uppercase tracking-[0.22em]";
const BODY = "mt-6 max-w-[62ch] text-lg leading-relaxed text-black/70";

const statStyles = [
    { bg: "bg-primary text-white", dim: "text-white/75" },
    { bg: "bg-secondary text-black", dim: "text-black/70" },
    { bg: "bg-accent text-black", dim: "text-black/70" },
    { bg: "bg-black text-white", dim: "text-white/70" },
];

const cardStyles = [
    { card: "bg-primary text-white", dim: "text-white/75" },
    { card: "bg-secondary text-black", dim: "text-black/65" },
    { card: "bg-accent text-black", dim: "text-black/65" },
];

function BlockView({ block, strapiUrl }: { block: Block; strapiUrl: string }) {
    switch (block.type) {
        case "intro": {
            const h = block.heading ?? {};
            return (
                <section className="mx-auto w-[90%] max-w-[1280px] pt-16 pb-6 sm:pt-24" data-reveal>
                    {h.eyebrow && <p className={`${EYEBROW} text-primary`}>{h.eyebrow}</p>}
                    {h.title && <Title title={h.title} className="font-display text-5xl font-black leading-[0.92] tracking-tight text-black sm:text-7xl" accent="text-secondary-deep" />}
                    {h.body && <p className="mt-8 max-w-[62ch] text-lg leading-relaxed text-black/70">{h.body}</p>}
                </section>
            );
        }

        case "richText":
            if (!block.bodyHtml) return null;
            return (
                <section className="mx-auto w-[90%] max-w-[1280px] py-8" data-reveal>
                    <div
                        className="prose max-w-[70ch] text-lg leading-relaxed text-black/75 [&_a]:font-bold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-secondary-deep [&_strong]:text-black [&_h3]:font-display [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-black"
                        dangerouslySetInnerHTML={{ __html: block.bodyHtml }}
                    />
                </section>
            );

        case "media":
            if (!block.image?.url) return null;
            return (
                <figure className="mx-auto w-[90%] max-w-[1280px] py-8" data-reveal>
                    <div className="overflow-hidden rounded-[2.75rem] shadow-lg">
                        <CmsPicture media={block.image} alt={block.image.alternativeText ?? block.caption ?? ""} widths={[720, 1280, 1920]} sizes="(min-width: 80em) 1280px, 90vw" className="h-auto w-full object-cover" strapiUrl={strapiUrl} />
                    </div>
                    {block.caption && <figcaption className="mt-3 text-sm text-black/60">{block.caption}</figcaption>}
                </figure>
            );

        case "quote":
            if (!block.text) return null;
            return (
                <section className="mx-auto w-[90%] max-w-[1280px] py-8" data-reveal>
                    <blockquote className="max-w-[52ch] border-l-2 border-primary pl-5 text-lg italic leading-relaxed text-black/80">
                        {block.text}
                        {block.cite && <cite className="mt-2 block text-sm not-italic text-black/55">{block.cite}</cite>}
                    </blockquote>
                </section>
            );

        case "stats":
            return (
                <section className="mx-auto w-[90%] max-w-[1280px] py-12">
                    <SectionHeading heading={block.heading} className="mb-10 max-w-[760px]" eyebrowClass={`${EYEBROW} text-primary`} titleClass="font-display text-4xl font-black leading-none text-black sm:text-6xl" accent="text-secondary-deep" bodyClass={BODY} />
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-reveal-group>
                        {block.stats.map((stat, index) => {
                            const style = statStyles[index % statStyles.length];
                            return (
                                <div key={index} className={`rounded-[2.25rem] p-8 spring hover:-translate-y-2 ${style.bg}`}>
                                    <p className="font-display text-6xl font-black tabular-nums">
                                        <span data-count={stat.target ?? undefined} data-count-prefix={stat.prefix ?? ""} data-count-suffix={stat.suffix ?? ""}>
                                            {stat.value}
                                        </span>
                                    </p>
                                    {stat.label && <p className="mt-3 font-display text-lg font-bold leading-snug">{stat.label}</p>}
                                    {stat.detail && <p className={`mt-2 text-sm leading-relaxed ${style.dim}`}>{stat.detail}</p>}
                                </div>
                            );
                        })}
                    </div>
                </section>
            );

        case "cardGrid":
            return (
                <section className="mx-auto w-[90%] max-w-[1280px] py-12">
                    <SectionHeading heading={block.heading} className="mb-10 max-w-[760px]" eyebrowClass={`${EYEBROW} text-secondary-deep`} titleClass="font-display text-4xl font-black leading-none text-black sm:text-6xl" bodyClass={BODY} />
                    <div className="grid gap-5 md:grid-cols-3" data-reveal-group>
                        {block.cards.map((card, index) => {
                            const style = cardStyles[index % cardStyles.length];
                            return (
                                <div key={index} className={`rounded-[2.25rem] p-8 spring hover:-translate-y-2 sm:p-10 ${style.card}`}>
                                    <h3 className="mb-3 font-display text-2xl font-bold">{card.title}</h3>
                                    <p className={`leading-relaxed ${style.dim}`}>{card.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            );

        case "timeline":
            return (
                <section className={islandClass("surface", "compact", "my-12")}>
                    <SectionHeading heading={block.heading} className="mb-10 max-w-[760px]" eyebrowClass={`${EYEBROW} text-primary`} titleClass="font-display text-4xl font-black leading-none text-black sm:text-6xl" bodyClass={BODY} />
                    <ol className="relative">
                        <div className="absolute bottom-2 left-[11px] top-2 w-[3px] rounded-full bg-primary/25" aria-hidden="true" />
                        {block.items.map((item, index) => (
                            <li key={index} className="relative mb-14 pl-12 last:mb-0 sm:pl-14" data-reveal>
                                <span className="absolute left-0 top-1 flex h-[25px] w-[25px] items-center justify-center rounded-full border-[3px] border-primary bg-surface" aria-hidden="true">
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                </span>
                                {(item.period || item.chip) && <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-primary">{item.period ?? item.chip}</p>}
                                <h3 className="mt-1 font-display text-2xl font-bold text-black sm:text-3xl">{item.title}</h3>
                                <p className="mt-2 max-w-[66ch] leading-relaxed text-black/70">{item.text}</p>
                                {item.image?.url && (
                                    <figure className={`mt-6 w-full max-w-[440px] overflow-hidden rounded-[1.75rem] shadow-lg ${index % 2 === 0 ? "rotate-[1.5deg]" : "rotate-[-1.5deg]"}`}>
                                        <CmsPicture media={item.image} alt={item.imageAlt ?? ""} widths={[440, 880]} sizes="(min-width: 40em) 440px, 100vw" className="h-auto w-full object-cover spring hover:scale-[1.04]" strapiUrl={strapiUrl} />
                                    </figure>
                                )}
                            </li>
                        ))}
                    </ol>
                </section>
            );

        case "awards":
            return (
                <section className="mx-auto w-[90%] max-w-[1280px] py-12">
                    <SectionHeading heading={block.heading} className="mb-12 max-w-[760px]" eyebrowClass={`${EYEBROW} text-secondary-deep`} titleClass="font-display text-4xl font-black leading-none text-primary sm:text-6xl" bodyClass={BODY} />
                    <div className="grid gap-5 md:grid-cols-2" data-reveal-group>
                        {block.awards.map((r, index) => (
                            <article key={index} className="flex flex-col rounded-[2.25rem] bg-surface p-8 spring hover:-translate-y-2 sm:p-10">
                                <div className="flex flex-wrap items-center gap-2">
                                    {r.year && <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">{r.year}</span>}
                                    {r.org && <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-bold text-black">{r.org}</span>}
                                </div>
                                <h3 className="mt-6 font-display text-3xl font-bold text-black">{r.title}</h3>
                                <p className="mt-3 leading-relaxed text-black/75">{r.text}</p>
                                {r.href && (
                                    <a href={r.href} target="_blank" rel="noopener noreferrer" className="mt-auto pt-6 text-sm font-bold text-primary underline underline-offset-4 transition hover:text-secondary-deep">
                                        {r.linkText ?? "Ver la fuente"} ↗
                                    </a>
                                )}
                            </article>
                        ))}
                    </div>
                    {block.note && (
                        <p className="mt-6 max-w-[80ch] text-sm text-black/60" data-reveal>
                            {block.note}
                        </p>
                    )}
                </section>
            );

        case "pressList":
            return (
                <section className="mx-auto w-[90%] max-w-[1280px] py-12" data-reveal>
                    {block.heading && (block.heading.eyebrow || block.heading.title) && (
                        <div className="max-w-[760px]">
                            {block.heading.eyebrow && <p className={`${EYEBROW} text-primary`}>{block.heading.eyebrow}</p>}
                            {block.heading.title && <Title title={block.heading.title} className="font-display text-4xl font-black leading-none text-black sm:text-6xl" />}
                            {block.heading.body && <p className={BODY}>{block.heading.body}</p>}
                        </div>
                    )}
                    <ul className="mt-8 divide-y divide-black/10">
                        {block.items.map((p, index) => (
                            <li key={index}>
                                <a href={p.href ?? undefined} target="_blank" rel="noopener noreferrer" className="group flex items-baseline justify-between gap-4 py-4 transition hover:text-primary">
                                    <span className="leading-snug">
                                        <span className="font-display font-bold">{p.title}</span>
                                        <span className="ml-2 whitespace-nowrap text-sm text-black/60">
                                            {p.outlet}
                                            {p.year ? ` · ${p.year}` : ""}
                                        </span>
                                    </span>
                                    <span className="text-primary opacity-0 transition group-hover:opacity-100" aria-hidden="true">
                                        ↗
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            );

        case "linkCards":
            return (
                <section className="mx-auto w-[90%] max-w-[1280px] py-12">
                    <SectionHeading heading={block.heading} className="mb-10 max-w-[760px]" eyebrowClass={`${EYEBROW} text-secondary-deep`} titleClass="font-display text-4xl font-black leading-none text-black sm:text-5xl" bodyClass={BODY} />
                    <div className="grid gap-5 md:grid-cols-3" data-reveal-group>
                        {block.cards.map((item, index) => (
                            <a
                                key={index}
                                href={item.href ?? undefined}
                                target={item.external ? "_blank" : undefined}
                                rel={item.external ? "noopener noreferrer" : undefined}
                                className="group flex flex-col rounded-[2.25rem] border border-black/10 p-8 spring hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_24px_50px_rgba(35,15,55,0.12)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:p-10"
                            >
                                {item.eyebrow && <p className="text-xs font-bold uppercase tracking-[0.22em] text-black/50 transition group-hover:text-primary">{item.eyebrow}</p>}
                                <h3 className="mt-4 font-display text-2xl font-bold text-black transition group-hover:text-primary">{item.title}</h3>
                                {item.text && <p className="mt-3 leading-relaxed text-black/70">{item.text}</p>}
                                <span className="mt-auto pt-6 font-display font-bold text-primary opacity-70 transition group-hover:opacity-100" aria-hidden="true">
                                    {item.linkText ?? "Seguir leyendo"} →
                                </span>
                            </a>
                        ))}
                    </div>
                </section>
            );

        case "allies": {
            const h = block.heading ?? {};
            const items = block.items.filter((i) => Boolean(i.text));
            return (
                <section className={islandClass("brand", "wide", "my-12 overflow-hidden")} data-reveal>
                    <div className="max-w-[760px]">
                        {h.eyebrow && <p className={`${EYEBROW} text-secondary`}>{h.eyebrow}</p>}
                        {h.title && <Title title={h.title} className="font-display text-4xl font-black leading-[0.95] sm:text-6xl" />}
                        {h.body && <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-white/75">{h.body}</p>}
                    </div>
                    <ul className="mt-8 flex flex-wrap gap-2">
                        {items.map((item, index) => (
                            <li key={index} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
                                {item.text}
                            </li>
                        ))}
                    </ul>
                </section>
            );
        }

        case "cta": {
            const h = block.heading ?? {};
            return (
                <section className={islandClass("accent", "cta", "my-12 overflow-hidden")} data-reveal>
                    <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
                        <div className="max-w-[760px]">
                            {h.eyebrow && <p className={`${EYEBROW} text-primary`}>{h.eyebrow}</p>}
                            {h.title && <Title title={h.title} className="font-display text-5xl font-black leading-[0.95] sm:text-7xl" />}
                            {h.body && <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-black/75">{h.body}</p>}
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            {block.button?.href && <MagicButton href={block.button.href} defaultText={block.button.defaultText ?? ""} hoverText={block.button.hoverText ?? ""} />}
                            {block.secondary?.href && (
                                <a
                                    href={block.secondary.href}
                                    target={isExternal(block.secondary.href) ? "_blank" : undefined}
                                    rel={isExternal(block.secondary.href) ? "noopener noreferrer" : undefined}
                                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-black px-7 py-3 text-center font-display font-bold text-white spring press hover:-translate-y-1 hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
                                >
                                    {block.secondary.text}
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            );
        }
    }
}

export default function BuilderBlocks({ blocks, strapiUrl }: Props) {
    return (
        <>
            {blocks.map((block, index) => (
                <BlockView key={index} block={block} strapiUrl={strapiUrl} />
            ))}
        </>
    );
}
