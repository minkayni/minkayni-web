/* ──────────────────────────────────────────────────────────────────────────
   Esquemas Zod escritos a mano para los single types de página en Strapi
   (about-page, impact-page, projects-page, batucada-*, global).

   Son deliberadamente laxos (todo nullish): si un campo aún no se llenó en
   el CMS, la página usa su fallback local (src/data/pages/*). Cuando se
   regenere `strapi.graphql.zod.ts` con `pnpm run zod:gen:lazy`, estos
   esquemas siguen siendo la fuente para las colecciones de contenido.
─────────────────────────────────────────────────────────────────────────── */
import { z } from "zod";
import { FooterSchema, HomepageSchema, PostSchema, UploadFileSchema, type Footer } from "./strapi.graphql.zod";

const media = () => UploadFileSchema().nullish();
const mediaList = () => z.array(UploadFileSchema().nullable()).nullish();

export const SectionHeadingSchema = () =>
    z.object({
        id: z.string().nullish(),
        eyebrow: z.string().nullish(),
        title: z.string().nullish(),
        body: z.string().nullish(),
    });

export const LinkSchema = () =>
    z.object({
        id: z.string().nullish(),
        text: z.string().nullish(),
        href: z.string().nullish(),
    });

export const ActionButtonSchema = () =>
    z.object({
        id: z.string().nullish(),
        href: z.string().nullish(),
        defaultText: z.string().nullish(),
        hoverText: z.string().nullish(),
    });

export const TimelineItemSchema = () =>
    z.object({
        id: z.string().nullish(),
        chip: z.string().nullish(),
        period: z.string().nullish(),
        title: z.string().nullish(),
        text: z.string().nullish(),
        accent: z.boolean().nullish(),
        image: media(),
        imageAlt: z.string().nullish(),
    });

export const StatSchema = () =>
    z.object({
        id: z.string().nullish(),
        value: z.string().nullish(),
        target: z.number().nullish(),
        prefix: z.string().nullish(),
        suffix: z.string().nullish(),
        label: z.string().nullish(),
        detail: z.string().nullish(),
    });

export const MethodStepSchema = () =>
    z.object({
        id: z.string().nullish(),
        number: z.string().nullish(),
        title: z.string().nullish(),
        text: z.string().nullish(),
    });

export const AwardSchema = () =>
    z.object({
        id: z.string().nullish(),
        year: z.string().nullish(),
        org: z.string().nullish(),
        recipient: z.string().nullish(),
        title: z.string().nullish(),
        text: z.string().nullish(),
        href: z.string().nullish(),
        linkText: z.string().nullish(),
    });

export const PressItemSchema = () =>
    z.object({
        id: z.string().nullish(),
        outlet: z.string().nullish(),
        year: z.string().nullish(),
        title: z.string().nullish(),
        href: z.string().nullish(),
        logo: media(),
    });

export const OrgCardSchema = () =>
    z.object({
        id: z.string().nullish(),
        kind: z.string().nullish(),
        name: z.string().nullish(),
        text: z.string().nullish(),
        accentColor: z.string().nullish(),
        dark: z.boolean().nullish(),
        logo: media(),
        instagramUrl: z.string().nullish(),
    });

/** Tarjeta de organización del ecosistema. Los fallbacks locales la usan para
    declarar los campos que sólo llegan desde el CMS (logo, instagramUrl). */
export type OrgCard = z.infer<ReturnType<typeof OrgCardSchema>>;

export const SectorSchema = () =>
    z.object({
        id: z.string().nullish(),
        name: z.string().nullish(),
        lat: z.number().nullish(),
        lng: z.number().nullish(),
        /** Fotos del barrio: salen al tocar su pin y se abren en el visor.
            La leyenda de cada una es el campo Caption de su archivo. */
        photos: mediaList(),
    });

export const ListItemSchema = () =>
    z.object({
        id: z.string().nullish(),
        text: z.string().nullish(),
        meta: z.string().nullish(),
    });

export const LinkCardSchema = () =>
    z.object({
        id: z.string().nullish(),
        eyebrow: z.string().nullish(),
        title: z.string().nullish(),
        text: z.string().nullish(),
        href: z.string().nullish(),
        linkText: z.string().nullish(),
        external: z.boolean().nullish(),
    });

export const CardSchema = () =>
    z.object({
        id: z.string().nullish(),
        title: z.string().nullish(),
        description: z.string().nullish(),
        icon: media(),
        showIcon: z.boolean().nullish(),
        cta: z.string().nullish(),
    });

export const MetricGroupSchema = () =>
    z.object({
        id: z.string().nullish(),
        title: z.string().nullish(),
        metrics: z.array(ListItemSchema().nullable()).nullish(),
    });

export const ProjectCardSchema = () =>
    z.object({
        id: z.string().nullish(),
        anchor: z.string().nullish(),
        category: z.string().nullish(),
        categoryLabel: z.string().nullish(),
        type: z.string().nullish(),
        title: z.string().nullish(),
        summary: z.string().nullish(),
        detail: z.string().nullish(),
        image: media(),
        imageAlt: z.string().nullish(),
        href: z.string().nullish(),
        linkText: z.string().nullish(),
        external: z.boolean().nullish(),
        accent: z.string().nullish(),
    });

export const FeaturedProjectSchema = () =>
    z.object({
        id: z.string().nullish(),
        title: z.string().nullish(),
        headline: z.string().nullish(),
        body: z.string().nullish(),
        logo: media(),
        photo: media(),
        button: ActionButtonSchema().nullish(),
        stats: z.array(StatSchema().nullable()).nullish(),
    });

export const SeoSchema = () =>
    z.object({
        id: z.string().nullish(),
        metaTitle: z.string().nullish(),
        metaDescription: z.string().nullish(),
        shareImage: media(),
    });

const entryBase = {
    documentId: z.string().nullish(),
    createdAt: z.string().nullish(),
    updatedAt: z.string().nullish(),
    publishedAt: z.string().nullish(),
    locale: z.string().nullish(),
};

export const AboutPageSchema = () =>
    z.object({
        ...entryBase,
        intro: SectionHeadingSchema().nullish(),
        actionLines: z.array(CardSchema().nullable()).nullish(),
        historyHeading: SectionHeadingSchema().nullish(),
        timeline: z.array(TimelineItemSchema().nullable()).nullish(),
        mission: CardSchema().nullish(),
        vision: CardSchema().nullish(),
        ecosystemHeading: SectionHeadingSchema().nullish(),
        ecosystemCards: z.array(OrgCardSchema().nullable()).nullish(),
        ecosystemLink: LinkSchema().nullish(),
        teamHeading: SectionHeadingSchema().nullish(),
        teamMembers: z.array(CardSchema().nullable()).nullish(),
        teamNote: z.string().nullish(),
        transparencyHeading: SectionHeadingSchema().nullish(),
        policies: z.array(ListItemSchema().nullable()).nullish(),
        transparencyNote: z.string().nullish(),
        pressHeading: SectionHeadingSchema().nullish(),
        pressLinks: z.array(PressItemSchema().nullable()).nullish(),
        pressCta: LinkSchema().nullish(),
        contactHeading: SectionHeadingSchema().nullish(),
        contactButton: ActionButtonSchema().nullish(),
        contactSecondary: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type AboutPage = z.infer<ReturnType<typeof AboutPageSchema>>;

export const ImpactPageSchema = () =>
    z.object({
        ...entryBase,
        intro: SectionHeadingSchema().nullish(),
        sectionNav: z.array(LinkSchema().nullable()).nullish(),
        stats: z.array(StatSchema().nullable()).nullish(),
        statsNote: z.string().nullish(),
        resultsHeading: SectionHeadingSchema().nullish(),
        resultsQuote: z.string().nullish(),
        resultsQuoteCite: z.string().nullish(),
        resultsLink: LinkSchema().nullish(),
        results: z.array(StatSchema().nullable()).nullish(),
        otherProcessesTitle: z.string().nullish(),
        otherProcesses: z.array(MetricGroupSchema().nullable()).nullish(),
        awardsHeading: SectionHeadingSchema().nullish(),
        awards: z.array(AwardSchema().nullable()).nullish(),
        awardsNote: z.string().nullish(),
        pressHeading: SectionHeadingSchema().nullish(),
        pressItems: z.array(PressItemSchema().nullable()).nullish(),
        journeyHeading: SectionHeadingSchema().nullish(),
        journeyCards: z.array(LinkCardSchema().nullable()).nullish(),
        ctaHeading: SectionHeadingSchema().nullish(),
        ctaButton: ActionButtonSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type ImpactPage = z.infer<ReturnType<typeof ImpactPageSchema>>;

export const ProjectsPageSchema = () =>
    z.object({
        ...entryBase,
        intro: SectionHeadingSchema().nullish(),
        explorerHeading: SectionHeadingSchema().nullish(),
        filters: z.array(ListItemSchema().nullable()).nullish(),
        projects: z.array(ProjectCardSchema().nullable()).nullish(),
        methodHeading: SectionHeadingSchema().nullish(),
        methodSteps: z.array(MethodStepSchema().nullable()).nullish(),
        methodLink: LinkSchema().nullish(),
        horizonHeading: SectionHeadingSchema().nullish(),
        horizonCards: z.array(CardSchema().nullable()).nullish(),
        alliancesHeading: SectionHeadingSchema().nullish(),
        allies: z.array(ListItemSchema().nullable()).nullish(),
        alliancesNote: z.string().nullish(),
        ctaButton: ActionButtonSchema().nullish(),
        ctaSecondary: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type ProjectsPage = z.infer<ReturnType<typeof ProjectsPageSchema>>;

export const BatucadaPageSchema = () =>
    z.object({
        ...entryBase,
        heroMetaLeft: z.string().nullish(),
        heroMetaRight: z.string().nullish(),
        heroTitle: z.string().nullish(),
        heroCaption: z.string().nullish(),
        heroPrimary: LinkSchema().nullish(),
        heroSecondary: LinkSchema().nullish(),
        heroImage: media(),
        introHeading: SectionHeadingSchema().nullish(),
        introBody: z.string().nullish(),
        figures: z.array(StatSchema().nullable()).nullish(),
        originTitle: z.string().nullish(),
        originItems: z.array(TimelineItemSchema().nullable()).nullish(),
        originLink: LinkSchema().nullish(),
        pulseHeading: SectionHeadingSchema().nullish(),
        pulseHighlight: z.string().nullish(),
        pulseImage: media(),
        methodHeading: SectionHeadingSchema().nullish(),
        methodSteps: z.array(MethodStepSchema().nullable()).nullish(),
        methodNote: z.string().nullish(),
        territoryHeading: SectionHeadingSchema().nullish(),
        sectors: z.array(SectorSchema().nullable()).nullish(),
        territoryHint: z.string().nullish(),
        actionHeading: SectionHeadingSchema().nullish(),
        communityActions: z.array(ListItemSchema().nullable()).nullish(),
        ecoHeading: SectionHeadingSchema().nullish(),
        ecosystemTags: z.array(ListItemSchema().nullable()).nullish(),
        ecoLink: LinkSchema().nullish(),
        awardsHeading: SectionHeadingSchema().nullish(),
        awards: z.array(AwardSchema().nullable()).nullish(),
        awardsNote: z.string().nullish(),
        rightsHeading: SectionHeadingSchema().nullish(),
        rightsBodyLeft: z.string().nullish(),
        rightsBodyRight: z.string().nullish(),
        rightsStamp: z.string().nullish(),
        ctaHeading: SectionHeadingSchema().nullish(),
        ctaPrimary: LinkSchema().nullish(),
        ctaSecondary: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type BatucadaPage = z.infer<ReturnType<typeof BatucadaPageSchema>>;

export const BatucadaEcosystemPageSchema = () =>
    z.object({
        ...entryBase,
        backLink: LinkSchema().nullish(),
        hero: SectionHeadingSchema().nullish(),
        pulseline: z.array(ListItemSchema().nullable()).nullish(),
        organismsHeading: SectionHeadingSchema().nullish(),
        organisms: z.array(OrgCardSchema().nullable()).nullish(),
        horizonsHeading: SectionHeadingSchema().nullish(),
        horizons: z.array(CardSchema().nullable()).nullish(),
        alliesHeading: SectionHeadingSchema().nullish(),
        allies: z.array(ListItemSchema().nullable()).nullish(),
        ctaHeading: SectionHeadingSchema().nullish(),
        ctaPrimary: LinkSchema().nullish(),
        ctaSecondary: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type BatucadaEcosystemPage = z.infer<ReturnType<typeof BatucadaEcosystemPageSchema>>;

export const BatucadaHistoryPageSchema = () =>
    z.object({
        ...entryBase,
        backLink: LinkSchema().nullish(),
        hero: SectionHeadingSchema().nullish(),
        pulseline: z.array(ListItemSchema().nullable()).nullish(),
        timelineHeading: SectionHeadingSchema().nullish(),
        timeline: z.array(TimelineItemSchema().nullable()).nullish(),
        senseHeading: SectionHeadingSchema().nullish(),
        senseHighlight: z.string().nullish(),
        senseImage: media(),
        ctaHeading: SectionHeadingSchema().nullish(),
        ctaPrimary: LinkSchema().nullish(),
        ctaSecondary: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type BatucadaHistoryPage = z.infer<ReturnType<typeof BatucadaHistoryPageSchema>>;

/* Subpáginas del constructor (collection type `page` con dynamic zone).
   Las secciones se validan de forma laxa: cada bloque se discrimina en el
   renderer por __typename. */
export const BuilderPageSchema = () =>
    z.object({
        ...entryBase,
        title: z.string().nullish(),
        slug: z.string().nullish(),
        description: z.string().nullish(),
        sections: z.array(z.any()).nullish(),
        seo: SeoSchema().nullish(),
    });
export type BuilderPage = z.infer<ReturnType<typeof BuilderPageSchema>>;

/* Actividades de campo (collection type `activity`): las crea el Reportero
   de campo del CMS y se ven en /novedades y /novedades/<slug>. */
export const ActivitySocialPostSchema = () =>
    z.object({
        documentId: z.string().nullish(),
        platform: z.string().nullish(),
        media_kind: z.string().nullish(),
        permalink: z.string().nullish(),
    });

export const ActivitySchema = () =>
    z.object({
        ...entryBase,
        title: z.string().nullish(),
        slug: z.string().nullish(),
        summary: z.string().nullish(),
        date: z.string().nullish(),
        end_date: z.string().nullish(),
        brand: z.enum(["minkayni", "batucada"]).nullish(),
        project: z.string().nullish(),
        place_name: z.string().nullish(),
        lat: z.number().nullish(),
        lng: z.number().nullish(),
        cover: media(),
        gallery: mediaList(),
        video: media(),
        sections: z.array(z.any()).nullish(),
        social_posts: z.array(ActivitySocialPostSchema().nullable()).nullish(),
        /* Enlaces que guarda el webhook de Postiz (Instagram, Facebook, TikTok, LinkedIn). */
        social_links: z.array(z.object({ platform: z.string().nullish(), url: z.string().nullish() }).nullable()).nullish(),
        /* Colaboradores y financiadores: su logo sale en la ficha de la actividad. */
        partners: z
            .array(z.object({ name: z.string().nullish(), role: z.enum(["colaborador", "financiador"]).nullish(), url: z.string().nullish(), logo: media() }).nullable())
            .nullish(),
        tags: z.array(z.string()).nullish(),
        is_featured: z.boolean().nullish(),
        seo: SeoSchema().nullish(),
    });
export type Activity = z.infer<ReturnType<typeof ActivitySchema>>;

/* Testimonios y Equipo (collection types; antes componentes de homepage). */
export const TestimonialEntrySchema = () =>
    z.object({
        ...entryBase,
        author_quote: z
            .object({
                id: z.string().nullish(),
                author: z.string().nullish(),
                body: z.any().nullish(),
            })
            .nullish(),
        organization: z.string().nullish(),
        picture: media(),
        age: z.number().nullish(),
        author_role: z.string().nullish(),
        sort: z.number().nullish(),
    });
export type TestimonialEntry = z.infer<ReturnType<typeof TestimonialEntrySchema>>;

export const TeamMemberEntrySchema = () =>
    z.object({
        ...entryBase,
        full_name: z.string().nullish(),
        role: z.string().nullish(),
        organization: z.string().nullish(),
        about: z.any().nullish(),
        picture: media(),
        email: z.string().nullish(),
        age: z.number().nullish(),
        phone_number: z.string().nullish(),
        sort: z.number().nullish(),
    });
export type TeamMemberEntry = z.infer<ReturnType<typeof TeamMemberEntrySchema>>;

export const GlobalSettingsSchema = () =>
    z.object({
        ...entryBase,
        siteName: z.string().nullish(),
        titleSuffix: z.string().nullish(),
        defaultSeo: SeoSchema().nullish(),
        contactEmail: z.string().nullish(),
        whatsappUrl: z.string().nullish(),
        menuLabel: z.string().nullish(),
        pageNav: z.array(LinkSchema().nullable()).nullish(),
    });
export type GlobalSettings = z.infer<ReturnType<typeof GlobalSettingsSchema>>;

/* ── Transparencia legal (single type `legal-transparency`) ──────────────
   Bloque institucional que consumen tanto el footer (bloque compacto) como
   la página /transparencia. Todo nullish: lo que falte en el CMS lo cubre
   el fallback local `src/data/pages/legal.ts`. */
export const LegalRecordSchema = () =>
    z.object({
        id: z.string().nullish(),
        label: z.string().nullish(),
        value: z.string().nullish(),
    });

export const LegalDocumentSchema = () =>
    z.object({
        id: z.string().nullish(),
        title: z.string().nullish(),
        note: z.string().nullish(),
        file: media(),
    });

export const LegalTransparencySchema = () =>
    z.object({
        ...entryBase,
        eyebrow: z.string().nullish(),
        title: z.string().nullish(),
        intro: z.string().nullish(),
        legalName: z.string().nullish(),
        tradeName: z.string().nullish(),
        ruc: z.string().nullish(),
        legalForm: z.string().nullish(),
        legalStatus: z.string().nullish(),
        ministryResolution: z.string().nullish(),
        incorporationDate: z.string().nullish(),
        suiosCode: z.string().nullish(),
        boardRegistration: z.string().nullish(),
        legalRepresentative: z.string().nullish(),
        economicActivity: z.string().nullish(),
        addressStreet: z.string().nullish(),
        addressLocality: z.string().nullish(),
        addressRegion: z.string().nullish(),
        addressCountry: z.string().nullish(),
        email: z.string().nullish(),
        phone: z.string().nullish(),
        website: z.string().nullish(),
        records: z.array(LegalRecordSchema().nullable()).nullish(),
        verificationLinks: z.array(LinkSchema().nullable()).nullish(),
        documents: z.array(LegalDocumentSchema().nullable()).nullish(),
        note: z.string().nullish(),
        pageLink: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type LegalTransparency = z.infer<ReturnType<typeof LegalTransparencySchema>>;

/* ── Página de donaciones (single type `donate-page`) ─────────────────── */
export const BankAccountSchema = () =>
    z.object({
        id: z.string().nullish(),
        bank: z.string().nullish(),
        accountType: z.string().nullish(),
        accountNumber: z.string().nullish(),
        holder: z.string().nullish(),
        taxId: z.string().nullish(),
        swift: z.string().nullish(),
        holderAddress: z.string().nullish(),
        bankAddress: z.string().nullish(),
        currency: z.string().nullish(),
        wireNote: z.string().nullish(),
        note: z.string().nullish(),
    });

/** Canal de donación con enlace propio (pasarela, plataforma o app de envío).
    Sólo se pinta si trae `href`: mientras la fundación no abra la cuenta, el
    canal simplemente no existe en la página, sin botones muertos. */
export const DonationMethodSchema = () =>
    z.object({
        id: z.string().nullish(),
        name: z.string().nullish(),
        description: z.string().nullish(),
        href: z.string().nullish(),
        linkText: z.string().nullish(),
        fee: z.string().nullish(),
        icon: z.string().nullish(),
    });
export type DonationMethod = z.infer<ReturnType<typeof DonationMethodSchema>>;

export const FaqItemSchema = () =>
    z.object({
        id: z.string().nullish(),
        question: z.string().nullish(),
        answer: z.string().nullish(),
    });
export type FaqItem = z.infer<ReturnType<typeof FaqItemSchema>>;

/** Bloque en inglés para donantes del exterior: el sitio es en español y
    esta es la única sección que un donante extranjero necesita entender. */
export const EnglishPanelSchema = () =>
    z.object({
        id: z.string().nullish(),
        title: z.string().nullish(),
        body: z.string().nullish(),
        note: z.string().nullish(),
    });

export const DonatePageSchema = () =>
    z.object({
        ...entryBase,
        intro: SectionHeadingSchema().nullish(),
        channelLinks: z.array(LinkSchema().nullable()).nullish(),
        accountsHeading: SectionHeadingSchema().nullish(),
        accounts: z.array(BankAccountSchema().nullable()).nullish(),
        transferNote: z.string().nullish(),
        internationalHeading: SectionHeadingSchema().nullish(),
        paymentMethodsHeading: SectionHeadingSchema().nullish(),
        paymentMethods: z.array(DonationMethodSchema().nullable()).nullish(),
        transferAppsHeading: SectionHeadingSchema().nullish(),
        transferApps: z.array(DonationMethodSchema().nullable()).nullish(),
        english: EnglishPanelSchema().nullish(),
        faqHeading: SectionHeadingSchema().nullish(),
        faq: z.array(FaqItemSchema().nullable()).nullish(),
        impactHeading: SectionHeadingSchema().nullish(),
        impactCards: z.array(CardSchema().nullable()).nullish(),
        otherWaysHeading: SectionHeadingSchema().nullish(),
        otherWays: z.array(CardSchema().nullable()).nullish(),
        contactButton: ActionButtonSchema().nullish(),
        whatsappLink: LinkSchema().nullish(),
        legalNote: z.string().nullish(),
        seo: SeoSchema().nullish(),
    });
export type DonatePage = z.infer<ReturnType<typeof DonatePageSchema>>;

/* ── Campos nuevos sobre tipos generados ──────────────────────────────────
   El CMS ya sirve estos campos, pero `strapi.graphql.zod.ts` no los conoce:
   la introspección de GraphQL está desactivada en producción y el esquema no
   se puede regenerar desde allí. Se declaran aquí una sola vez para las dos
   versiones de idioma; cuando se regenere, `.extend` sencillamente coincide. */
export const PostContentSchema = () => PostSchema().extend({ poster: media() });

export const HomepageContentSchema = () =>
    HomepageSchema().extend({
        testimonialsTitle: z.string().nullish(),
        teamTitle: z.string().nullish(),
        featuredProject: FeaturedProjectSchema().nullish(),
        projectsCtaHeading: SectionHeadingSchema().nullish(),
        projectsCtaTags: z.array(ListItemSchema().nullable()).nullish(),
        projectsCtaButton: ActionButtonSchema().nullish(),
    });

const footerExtras = () => ({
    partnersTitle: z.string().nullish(),
    joinTitle: z.string().nullish(),
    joinSubtitle: z.string().nullish(),
    joinButton: ActionButtonSchema().nullish(),
});
export const FooterContentSchema = () => FooterSchema().extend(footerExtras());
export type FooterContent = Footer & z.infer<z.ZodObject<ReturnType<typeof footerExtras>>>;
