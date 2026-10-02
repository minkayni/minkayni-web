/* Fallback local de los ajustes globales del sitio (single type `global`). */

export const globalFallback = {
    siteName: "Fundación Minkayni",
    titleSuffix: "• Fundación Minkayni",
    defaultSeo: {
        metaTitle: "Fundación Minkayni",
        metaDescription: "Fundación Minkayni transforma comunidades a través del arte, el liderazgo juvenil y la cultura de paz en Guayaquil.",
    },
    contactEmail: "info@minkayni.org",
    whatsappUrl: "https://wa.me/593985261647",
    menuLabel: "Fundación MINKAYNI",
    pageNav: [
        { text: "Momentos", href: "#moments" },
        { text: "Testimonios", href: "#testimonials" },
        { text: "Nosotros", href: "#about-us" },
        { text: "Proyectos", href: "#projects" },
    ],
};

/* Textos del footer que hoy están fijos en el componente (mezclados con
   la entrada `footer` de Strapi en los layouts). */
export const footerTextsFallback = {
    partnersTitle: "Nuestros Aliados",
    joinTitle: "¿Quieres ser nuestro aliado?",
    joinSubtitle: "Juntos construyamos nuevas oportunidades",
    joinButton: { href: "/about#contacto", defaultText: "Quiero unirme 💜", hoverText: "a cambiar vidas ✨" },
};

/* Títulos de secciones de la portada (campos nuevos del single type homepage). */
export const homepageTextsFallback = {
    testimonialsTitle: "Historias de cambio",
    teamTitle: "Conoce a nuestro equipo",
};

/* Bloque "Proyecto destacado" de la portada (componente sections.featured-project). */
export const featuredProjectFallback = {
    title: "Proyecto destacado",
    headline: "Más que música: *un refugio* que suena.",
    body: "Nuestro proyecto estrella es la Batucada Popular, una iniciativa cultural y social que utiliza la música —especialmente los tambores y la percusión— como herramienta de transformación comunitaria y protección de jóvenes en contextos vulnerables.\n\nAl promover Derechos Humanos, convivencia pacífica y resistencia cultural, la Batucada crea un refugio comunitario y fortalece redes de apoyo barrial: los ensayos son espacios seguros donde las juventudes aprenden disciplina, lideran procesos y se reconocen como protagonistas del cambio social.\n\nLo que empezó en pandemia con palos y baldes es hoy una red juvenil con metodología propia, reconocida por el Resilience Fund de GI-TOC y premiada por la ciudad de Guayaquil.",
    stats: [
        { value: "+300", target: 300, prefix: "+", label: "integrantes" },
        { value: "12", target: 12, prefix: "", label: "sectores" },
        { value: "2020", target: 0, prefix: "", label: "desde" },
    ],
    button: { href: "/projects/batucada-popular/", defaultText: "Descubre más 🚀", hoverText: "Y siente su impacto 🔥" },
};

/* Sección CTA hacia /projects en la portada (campos projectsCta* de homepage). */
export const projectsCtaFallback = {
    heading: {
        eyebrow: "Más allá del proyecto insignia",
        title: "Un tambor.\n*Un ecosistema* de proyectos.",
        body: "Comunicación popular, liderazgo juvenil, economía circular, investigación y protección comunitaria: explora todo lo que crece alrededor de la Batucada Popular.",
    },
    tags: [{ text: "Música" }, { text: "Liderazgo" }, { text: "Comunicación" }, { text: "Comunidad" }, { text: "Economía" }, { text: "Investigación" }],
    button: { href: "/projects", defaultText: "Explora los proyectos 🥁", hoverText: "Y todo el ecosistema ✨" },
};
