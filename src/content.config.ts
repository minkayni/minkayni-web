import { defineCollection } from "astro:content";
import type { Loader } from "astro/loaders";
import { strapiLoader } from "./utils/loaders/strapi-loader";
import { navigationLoader } from "./utils/loaders/strapi-navigation-loader";
import { validateStrapiConnection } from "./utils/strapi-connection";
import { z } from "zod";
import {
  AboutPageSchema,
  ImpactPageSchema,
  ProjectsPageSchema,
  BatucadaPageSchema,
  BatucadaEcosystemPageSchema,
  BatucadaHistoryPageSchema,
  BuilderPageSchema,
  ActivitySchema,
  GlobalSettingsSchema,
  PostContentSchema,
  HomepageContentSchema,
  FooterContentSchema,
  TestimonialEntrySchema,
  TeamMemberEntrySchema,
  LegalTransparencySchema,
  DonatePageSchema,
} from "./schemas/pages.zod";
import { NavigationTreeSchema } from "./schemas/navigation";

const STRAPI_BASE = (import.meta.env.STRAPI_URL ?? "").trim().replace(/\/+$/, "");
const STRAPI_TOKEN = (import.meta.env.STRAPI_TOKEN ?? "").trim();
const GRAPHQL_ENDPOINT = STRAPI_BASE ? `${STRAPI_BASE}/graphql` : "";

/* Solo la autorización: el loader pone el resto de cabeceras, incluido el
   nombre de cada operación, y estas se aplican después de las suyas. */
const buildAuthHeaders = (token?: string): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

const strictStrapi = import.meta.env.STRAPI_STRICT === "true";
const strapiConfigured = Boolean(GRAPHQL_ENDPOINT && STRAPI_TOKEN);

if (strictStrapi) {
  const check = await validateStrapiConnection({
    endpoint: GRAPHQL_ENDPOINT,
    token: STRAPI_TOKEN,
  });
  if (!check.ok)
    throw new Error(check.message ?? "Strapi connection failed");
}

const preserveCachedContent = (name: string): Loader => ({
  name,
  async load({ logger }) {
    logger.warn(
      `[${name}] Strapi no está disponible; se conserva el contenido local existente.`
    );
  },
});

const contentCacheMs = import.meta.env.DEV ? 15 * 60 * 1000 : 0;

const clientHeaders = GRAPHQL_ENDPOINT
  ? { endpoint: GRAPHQL_ENDPOINT, headers: buildAuthHeaders(STRAPI_TOKEN) }
  : { endpoint: GRAPHQL_ENDPOINT };

const uploadFileSelection = `
    documentId
    name
    alternativeText
    caption
    width
    height
    formats
    hash
    ext
    mime
    size
    url
    previewUrl
    provider
    provider_metadata
    createdAt
    updatedAt
    publishedAt
`;

const postSelection = `
    documentId
    platform
    media_kind
    permalink
    external_id
    owner_handle
    caption
    like_count
    comment_count
    view_count
    posted_at
    source { ${uploadFileSelection} }
    thumbnail_url
    is_featured
    createdAt
    updatedAt
    publishedAt
`;
/* `poster` (la portada de los reels) es el campo más nuevo del CMS: si la web
   se construye antes que él, se piden las publicaciones sin él. */
const postPosterSelection = `poster { ${uploadFileSelection} }`;

/* ── Selecciones GraphQL reutilizables (componentes de página) ─────────── */
const headingSelection = `id eyebrow title body`;
const linkSelection = `id text href`;
const buttonSelection = `id href defaultText hoverText`;
const listItemSelection = `id text meta`;
const statSelection = `id value target prefix suffix label detail`;
const stepSelection = `id number title text`;
const awardSelection = `id year org recipient title text href linkText`;
const orgCardSelection = `id kind name text accentColor dark instagramUrl logo { ${uploadFileSelection} }`;
const sectorSelection = `id name lat lng photos(pagination: { limit: 100 }) { ${uploadFileSelection} }`;
const linkCardSelection = `id eyebrow title text href linkText external`;
const timelineSelection = `id chip period title text accent imageAlt image { ${uploadFileSelection} }`;
const cardSelection = `id title description showIcon cta icon { ${uploadFileSelection} }`;
const pressItemSelection = `id outlet year title href logo { ${uploadFileSelection} }`;
const seoSelection = `id metaTitle metaDescription shareImage { ${uploadFileSelection} }`;
const metricGroupSelection = `id title metrics(pagination: { limit: 100 }) { ${listItemSelection} }`;
const projectCardSelection = `id anchor category categoryLabel type title summary detail imageAlt href linkText external accent image { ${uploadFileSelection} }`;
const featuredProjectSelection = `id title headline body logo { ${uploadFileSelection} } photo { ${uploadFileSelection} } button { ${buttonSelection} } stats(pagination: { limit: 100 }) { ${statSelection} }`;

const entryMetaSelection = `
    documentId
    createdAt
    updatedAt
    publishedAt
    locale
`;

/* Testimonios y Equipo viven en sus propios collection types
   (colecciones `testimonials` y `teamMembers` más abajo). */
const testimonialSelection = `
    documentId
    createdAt
    updatedAt
    publishedAt
    author_quote { id author body }
    organization
    picture { ${uploadFileSelection} }
    age
    author_role
    sort
`;

const teamMemberSelection = `
    documentId
    createdAt
    updatedAt
    publishedAt
    full_name
    role
    organization
    about
    picture { ${uploadFileSelection} }
    email
    age
    sort
`;

const homepageSelection = `
    documentId
    legend
    testimonialsTitle
    teamTitle
    featuredProject { ${featuredProjectSelection} }
    projectsCtaHeading { ${headingSelection} }
    projectsCtaTags(pagination: { limit: 100 }) { ${listItemSelection} }
    projectsCtaButton { ${buttonSelection} }
    createdAt
    updatedAt
    publishedAt
    locale
`;

const footerSelection = `
    documentId
    privacyLink { id text href }
    termsLink { id text href }
    Socials { id facebook instagram twitter tiktok }
    Copyright { id legalname yearStart autoYear yearOverride extraText }
    partnersGallery {
        id
        files(pagination: { limit: 100 }) { ${uploadFileSelection} }
    }
    partnersTitle
    joinTitle
    joinSubtitle
    joinButton { ${buttonSelection} }
    createdAt
    updatedAt
    publishedAt
    locale
`;

/* ── Selecciones de los single types de página ─────────────────────────── */
const aboutPageSelection = `
    ${entryMetaSelection}
    intro { ${headingSelection} }
    actionLines(pagination: { limit: 100 }) { ${cardSelection} }
    historyHeading { ${headingSelection} }
    timeline(pagination: { limit: 100 }) { ${timelineSelection} }
    mission { ${cardSelection} }
    vision { ${cardSelection} }
    ecosystemHeading { ${headingSelection} }
    ecosystemCards(pagination: { limit: 100 }) { ${orgCardSelection} }
    ecosystemLink { ${linkSelection} }
    teamHeading { ${headingSelection} }
    teamMembers(pagination: { limit: 100 }) { ${cardSelection} }
    teamNote
    transparencyHeading { ${headingSelection} }
    policies(pagination: { limit: 100 }) { ${listItemSelection} }
    transparencyNote
    pressHeading { ${headingSelection} }
    pressLinks(pagination: { limit: 100 }) { ${pressItemSelection} }
    pressCta { ${linkSelection} }
    contactHeading { ${headingSelection} }
    contactButton { ${buttonSelection} }
    contactSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const impactPageSelection = `
    ${entryMetaSelection}
    intro { ${headingSelection} }
    sectionNav(pagination: { limit: 100 }) { ${linkSelection} }
    stats(pagination: { limit: 100 }) { ${statSelection} }
    statsNote
    resultsHeading { ${headingSelection} }
    resultsQuote
    resultsQuoteCite
    resultsLink { ${linkSelection} }
    results(pagination: { limit: 100 }) { ${statSelection} }
    otherProcessesTitle
    otherProcesses(pagination: { limit: 100 }) { ${metricGroupSelection} }
    awardsHeading { ${headingSelection} }
    awards(pagination: { limit: 100 }) { ${awardSelection} }
    awardsNote
    pressHeading { ${headingSelection} }
    pressItems(pagination: { limit: 100 }) { ${pressItemSelection} }
    journeyHeading { ${headingSelection} }
    journeyCards(pagination: { limit: 100 }) { ${linkCardSelection} }
    ctaHeading { ${headingSelection} }
    ctaButton { ${buttonSelection} }
    seo { ${seoSelection} }
`;

const projectsPageSelection = `
    ${entryMetaSelection}
    intro { ${headingSelection} }
    explorerHeading { ${headingSelection} }
    filters(pagination: { limit: 100 }) { ${listItemSelection} }
    projects(pagination: { limit: 100 }) { ${projectCardSelection} }
    methodHeading { ${headingSelection} }
    methodSteps(pagination: { limit: 100 }) { ${stepSelection} }
    methodLink { ${linkSelection} }
    horizonHeading { ${headingSelection} }
    horizonCards(pagination: { limit: 100 }) { ${cardSelection} }
    alliancesHeading { ${headingSelection} }
    allies(pagination: { limit: 100 }) { ${listItemSelection} }
    alliancesNote
    ctaButton { ${buttonSelection} }
    ctaSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const batucadaPageSelection = `
    ${entryMetaSelection}
    heroMetaLeft
    heroMetaRight
    heroTitle
    heroCaption
    heroPrimary { ${linkSelection} }
    heroSecondary { ${linkSelection} }
    heroImage { ${uploadFileSelection} }
    introHeading { ${headingSelection} }
    introBody
    figures(pagination: { limit: 100 }) { ${statSelection} }
    originTitle
    originItems(pagination: { limit: 100 }) { ${timelineSelection} }
    originLink { ${linkSelection} }
    pulseHeading { ${headingSelection} }
    pulseHighlight
    pulseImage { ${uploadFileSelection} }
    methodHeading { ${headingSelection} }
    methodSteps(pagination: { limit: 100 }) { ${stepSelection} }
    methodNote
    territoryHeading { ${headingSelection} }
    sectors(pagination: { limit: 100 }) { ${sectorSelection} }
    territoryHint
    actionHeading { ${headingSelection} }
    communityActions(pagination: { limit: 100 }) { ${listItemSelection} }
    ecoHeading { ${headingSelection} }
    ecosystemTags(pagination: { limit: 100 }) { ${listItemSelection} }
    ecoLink { ${linkSelection} }
    awardsHeading { ${headingSelection} }
    awards(pagination: { limit: 100 }) { ${awardSelection} }
    awardsNote
    rightsHeading { ${headingSelection} }
    rightsBodyLeft
    rightsBodyRight
    rightsStamp
    ctaHeading { ${headingSelection} }
    ctaPrimary { ${linkSelection} }
    ctaSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const batucadaEcosystemPageSelection = `
    ${entryMetaSelection}
    backLink { ${linkSelection} }
    hero { ${headingSelection} }
    pulseline(pagination: { limit: 100 }) { ${listItemSelection} }
    organismsHeading { ${headingSelection} }
    organisms(pagination: { limit: 100 }) { ${orgCardSelection} }
    horizonsHeading { ${headingSelection} }
    horizons(pagination: { limit: 100 }) { ${cardSelection} }
    alliesHeading { ${headingSelection} }
    allies(pagination: { limit: 100 }) { ${listItemSelection} }
    ctaHeading { ${headingSelection} }
    ctaPrimary { ${linkSelection} }
    ctaSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const batucadaHistoryPageSelection = `
    ${entryMetaSelection}
    backLink { ${linkSelection} }
    hero { ${headingSelection} }
    pulseline(pagination: { limit: 100 }) { ${listItemSelection} }
    timelineHeading { ${headingSelection} }
    timeline(pagination: { limit: 100 }) { ${timelineSelection} }
    senseHeading { ${headingSelection} }
    senseHighlight
    senseImage { ${uploadFileSelection} }
    ctaHeading { ${headingSelection} }
    ctaPrimary { ${linkSelection} }
    ctaSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

/* Subpáginas del constructor: dynamic zone discriminada por __typename.
   Los campos heading/cards/items llevan ALIAS únicos por fragmento: GraphQL
   rechaza el mismo nombre con nulabilidad distinta entre tipos de la unión.
   normalize.ts (components/react/builder) los devuelve a heading/cards/items. */
/* Bloques añadidos en octubre de 2026 (galería, vídeo, foto y texto,
   preguntas). Con alias propios, como el resto: en una unión de GraphQL dos
   fragmentos no pueden pedir el mismo campo con tipos distintos. */
const newBlockFragments = `
        ... on ComponentBlocksGallery { id galleryHeading: heading { ${headingSelection} } galleryImages: images(pagination: { limit: 100 }) { ${uploadFileSelection} } galleryCaption: caption }
        ... on ComponentBlocksVideo { id videoUrl: url videoFile: file { ${uploadFileSelection} } videoCaption: caption }
        ... on ComponentBlocksMediaText { id mediaTextHeading: heading { ${headingSelection} } mediaTextBody: body mediaTextImage: image { ${uploadFileSelection} } mediaTextCaption: caption imagePosition }
        ... on ComponentBlocksFaq { id faqHeading: heading { ${headingSelection} } faqItems: items(pagination: { limit: 100 }) { id question answer } }
`;

const builderSectionsSelectionWith = (extra: string) => `
    sections {
        __typename${extra}
        ... on ComponentBlocksIntro { id introHeading: heading { ${headingSelection} } }
        ... on ComponentBlocksRichText { id body }
        ... on ComponentBlocksMedia { id caption image { ${uploadFileSelection} } }
        ... on ComponentBlocksQuote { id text cite }
        ... on ComponentBlocksStats { id statsHeading: heading { ${headingSelection} } stats(pagination: { limit: 100 }) { ${statSelection} } }
        ... on ComponentBlocksCardGrid { id gridHeading: heading { ${headingSelection} } gridCards: cards(pagination: { limit: 100 }) { ${cardSelection} } }
        ... on ComponentBlocksTimeline { id timelineHeading: heading { ${headingSelection} } timelineItems: items(pagination: { limit: 100 }) { ${timelineSelection} } }
        ... on ComponentBlocksAwards { id awardsHeading: heading { ${headingSelection} } awards(pagination: { limit: 100 }) { ${awardSelection} } note }
        ... on ComponentBlocksPressList { id pressHeading: heading { ${headingSelection} } pressItems: items(pagination: { limit: 100 }) { ${pressItemSelection} } }
        ... on ComponentBlocksLinkCards { id linksHeading: heading { ${headingSelection} } linkCards: cards(pagination: { limit: 100 }) { ${linkCardSelection} } }
        ... on ComponentBlocksAllies { id alliesHeading: heading { ${headingSelection} } allyItems: items(pagination: { limit: 100 }) { ${listItemSelection} } }
        ... on ComponentBlocksCta { id ctaHeading: heading { ${headingSelection} } button { ${buttonSelection} } secondary { ${linkSelection} } }
        ... on Error { code message }
    }
`;

/* Si la web se construye contra un CMS que aún no tiene los bloques nuevos,
   GraphQL rechaza la consulta entera («Unknown type»); el loader repite
   entonces con la selección de reserva, sin ellos (ver strapi-loader.ts). */
const builderSectionsSelection = builderSectionsSelectionWith(newBlockFragments);
const legacySectionsSelection = builderSectionsSelectionWith("");

const builderPageSelectionWith = (sections: string) => `
    ${entryMetaSelection}
    title
    slug
    description
    ${sections}
    seo { ${seoSelection} }
`;

/* Actividades de campo: mismos bloques que el constructor. */
const activitySelectionWith = (sections: string) => `
    ${entryMetaSelection}
    title
    slug
    summary
    date
    end_date
    brand
    project
    place_name
    lat
    lng
    is_featured
    tags
    cover { ${uploadFileSelection} }
    gallery(pagination: { limit: 100 }) { ${uploadFileSelection} }
    video { ${uploadFileSelection} }
    ${sections}
    social_posts(pagination: { limit: 20 }) { documentId platform media_kind permalink }
    social_links
    seo { ${seoSelection} }
`;

const donationMethodSelection = `id name description href linkText fee icon`;

const donatePageSelection = `
    ${entryMetaSelection}
    intro { ${headingSelection} }
    channelLinks(pagination: { limit: 10 }) { ${linkSelection} }
    accountsHeading { ${headingSelection} }
    accounts(pagination: { limit: 100 }) { id bank accountType accountNumber holder taxId swift holderAddress bankAddress currency wireNote note }
    transferNote
    internationalHeading { ${headingSelection} }
    paymentMethodsHeading { ${headingSelection} }
    paymentMethods(pagination: { limit: 100 }) { ${donationMethodSelection} }
    transferAppsHeading { ${headingSelection} }
    transferApps(pagination: { limit: 100 }) { ${donationMethodSelection} }
    english { id title body note }
    faqHeading { ${headingSelection} }
    faq(pagination: { limit: 100 }) { id question answer }
    impactHeading { ${headingSelection} }
    impactCards(pagination: { limit: 100 }) { ${cardSelection} }
    otherWaysHeading { ${headingSelection} }
    otherWays(pagination: { limit: 100 }) { ${cardSelection} }
    contactButton { ${buttonSelection} }
    whatsappLink { ${linkSelection} }
    legalNote
    seo { ${seoSelection} }
`;

const legalTransparencySelection = `
    ${entryMetaSelection}
    eyebrow
    title
    intro
    legalName
    tradeName
    ruc
    legalForm
    legalStatus
    ministryResolution
    incorporationDate
    suiosCode
    boardRegistration
    legalRepresentative
    economicActivity
    addressStreet
    addressLocality
    addressRegion
    addressCountry
    email
    phone
    website
    records(pagination: { limit: 100 }) { id label value }
    verificationLinks(pagination: { limit: 100 }) { ${linkSelection} }
    documents(pagination: { limit: 100 }) { id title note file { ${uploadFileSelection} } }
    note
    pageLink { ${linkSelection} }
    seo { ${seoSelection} }
`;

const globalSelection = `
    ${entryMetaSelection}
    siteName
    titleSuffix
    defaultSeo { ${seoSelection} }
    contactEmail
    whatsappUrl
    menuLabel
    pageNav(pagination: { limit: 100 }) { ${linkSelection} }
`;

/* ── Fábrica de colecciones de Strapi ─────────────────────────────────────
   Todas las colecciones comparten cliente, modo estricto y caché; solo cambian
   la consulta, el esquema y el idioma. Una colección de Astro admite un solo
   loader y el loader lleva el locale dentro de la consulta GraphQL, así que
   cada idioma es su propia colección: `aboutPage` (español) y `aboutPageEn`
   (inglés). `loadPageContent` elige entre las dos y cae al español cuando el
   inglés todavía está vacío.

   `locale` se pasa tal cual: los tipos sin i18n en el CMS rechazan el
   argumento, por eso el español de algunas colecciones no lo lleva. */
type StrapiCollection<S extends z.ZodType> = {
  rootField: string;
  selection: string;
  schema: S;
  mode?: "single" | "collection";
  locale?: "es" | "en";
  fallbackSelection?: string;
};

const defineStrapiCollection = <S extends z.ZodType>({
  rootField,
  selection,
  schema,
  mode = "single",
  locale,
  fallbackSelection,
}: StrapiCollection<S>) =>
  defineCollection({
    loader: strapiConfigured
      ? strapiLoader({
          mode,
          rootField,
          selection,
          fallbackSelection,
          client: clientHeaders,
          strict: strictStrapi,
          cacheDurationInMs: contentCacheMs,
          locale,
          ...(mode === "single" ? { idResolver: () => rootField } : {}),
        })
      : preserveCachedContent(locale === "en" ? `${rootField}:en` : rootField),
    schema,
  });

/** El par español/inglés de una misma colección. */
const defineBilingual = <S extends z.ZodType>(
  options: Omit<StrapiCollection<S>, "locale">,
  spanishLocale?: "es"
) =>
  [
    defineStrapiCollection({ ...options, locale: spanishLocale }),
    defineStrapiCollection({ ...options, locale: "en" }),
  ] as const;

const posts = defineStrapiCollection({
  mode: "collection",
  rootField: "posts",
  selection: `${postSelection}
    ${postPosterSelection}`,
  fallbackSelection: postSelection,
  schema: PostContentSchema(),
});

const [homepage, homepageEn] = defineBilingual(
  { rootField: "homepage", selection: homepageSelection, schema: HomepageContentSchema() },
  "es"
);
const [footer, footerEn] = defineBilingual(
  { rootField: "footer", selection: footerSelection, schema: FooterContentSchema() },
  "es"
);

const navigationHeader = defineCollection({
  loader: strapiConfigured
    ? navigationLoader({
        slug: "header",
        locale: "es",
        url: STRAPI_BASE,
        token: STRAPI_TOKEN,
        cacheMs: contentCacheMs,
        strict: strictStrapi,
      })
    : preserveCachedContent("navigationHeader"),
  schema: NavigationTreeSchema,
});

/* El plugin Navigation guarda un árbol por idioma. Mientras el árbol `header`
   en inglés no exista en el CMS, este loader devuelve una lista vacía y los
   layouts usan `navigationFallbackEn` (src/data/pages/global.ts). */
const navigationHeaderEn = defineCollection({
  loader: strapiConfigured
    ? navigationLoader({
        slug: "header",
        locale: "en",
        url: STRAPI_BASE,
        token: STRAPI_TOKEN,
        cacheMs: contentCacheMs,
        strict: strictStrapi,
      })
    : preserveCachedContent("navigationHeader:en"),
  schema: NavigationTreeSchema,
});

/* ── Single types de página ────────────────────────────────────────────── */
/* El editor traduce en el CMS con el selector de idioma del admin; hasta que
   lo haga, las colecciones inglesas llegan vacías y se sirve el español. */
const pageSingle = <S extends z.ZodType>(rootField: string, selection: string, schema: S) =>
  defineBilingual({ rootField, selection, schema }, "es");

const [aboutPage, aboutPageEn] = pageSingle("aboutPage", aboutPageSelection, AboutPageSchema());
const [impactPage, impactPageEn] = pageSingle("impactPage", impactPageSelection, ImpactPageSchema());
const [projectsPage, projectsPageEn] = pageSingle("projectsPage", projectsPageSelection, ProjectsPageSchema());
const [batucadaPage, batucadaPageEn] = pageSingle("batucadaPage", batucadaPageSelection, BatucadaPageSchema());
const [batucadaEcosystemPage, batucadaEcosystemPageEn] = pageSingle(
  "batucadaEcosystemPage",
  batucadaEcosystemPageSelection,
  BatucadaEcosystemPageSchema()
);
const [batucadaHistoryPage, batucadaHistoryPageEn] = pageSingle(
  "batucadaHistoryPage",
  batucadaHistoryPageSelection,
  BatucadaHistoryPageSchema()
);
const [globalSettings, globalSettingsEn] = pageSingle("global", globalSelection, GlobalSettingsSchema());
const [legalTransparency, legalTransparencyEn] = pageSingle(
  "legalTransparency",
  legalTransparencySelection,
  LegalTransparencySchema()
);
const [donatePage, donatePageEn] = pageSingle("donatePage", donatePageSelection, DonatePageSchema());

/* ── Collection types ──────────────────────────────────────────────────── */
/* Testimonios y Equipo (orden por campo sort). Si el CMS desplegado no tiene
   el i18n activo en un tipo, la consulta inglesa falla, el loader conserva la
   caché vacía y la portada inglesa los muestra en español. */
const [testimonials, testimonialsEn] = defineBilingual({
  mode: "collection",
  rootField: "testimonials",
  selection: testimonialSelection,
  schema: TestimonialEntrySchema(),
});
const [teamMembers, teamMembersEn] = defineBilingual({
  mode: "collection",
  rootField: "teamMembers",
  selection: teamMemberSelection,
  schema: TeamMemberEntrySchema(),
});

/* Subpáginas del constructor (collection type `page`). */
const [builderPages, builderPagesEn] = defineBilingual({
  mode: "collection",
  rootField: "pages",
  selection: builderPageSelectionWith(builderSectionsSelection),
  fallbackSelection: builderPageSelectionWith(legacySectionsSelection),
  schema: BuilderPageSchema(),
});

/* Actividades de campo (collection type `activity`). Si el CMS desplegado
   todavía no tiene el tipo, la consulta falla, el loader avisa y /novedades
   se queda solo con las publicaciones de redes. */
const [activities, activitiesEn] = defineBilingual({
  mode: "collection",
  rootField: "activities",
  selection: activitySelectionWith(builderSectionsSelection),
  fallbackSelection: activitySelectionWith(legacySectionsSelection),
  schema: ActivitySchema(),
});

export const collections = {
  posts,
  homepage,
  homepageEn,
  navigationHeader,
  navigationHeaderEn,
  footer,
  footerEn,
  testimonials,
  testimonialsEn,
  teamMembers,
  teamMembersEn,
  aboutPage,
  aboutPageEn,
  impactPage,
  impactPageEn,
  projectsPage,
  projectsPageEn,
  batucadaPage,
  batucadaPageEn,
  batucadaEcosystemPage,
  batucadaEcosystemPageEn,
  batucadaHistoryPage,
  batucadaHistoryPageEn,
  globalSettings,
  globalSettingsEn,
  legalTransparency,
  legalTransparencyEn,
  donatePage,
  donatePageEn,
  builderPages,
  builderPagesEn,
  activities,
  activitiesEn,
};
