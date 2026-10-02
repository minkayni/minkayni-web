/* ──────────────────────────────────────────────────────────────────────────
   Cadenas de interfaz que viven en el repositorio, no en Strapi.

   Aquí NO va contenido editorial: eso es del CMS, donde una persona puede
   corregirlo sin tocar código. Aquí van las etiquetas que forman parte de la
   interfaz —textos de accesibilidad, estados de carga, créditos del pie— que
   cambian solo cuando cambia el código que las usa.

   Regla para añadir una clave: si el texto puede quedarse obsoleto sin que
   nadie toque un `.astro`, pertenece al CMS. Si desaparece al borrar un
   componente, pertenece aquí.

   Los nombres propios no se traducen: «Batucada Popular», «MINKAYNI»,
   «Guayaquil» y los nombres de los sectores son los mismos en los dos idiomas.
─────────────────────────────────────────────────────────────────────────── */

export const ui = {
    es: {
        /* Navegación y menú */
        "nav.home": "Inicio",
        "nav.goHome": "Ir al inicio",
        "nav.submenuOf": "Submenú de {title}",
        "nav.mainNavigation": "Navegación principal",
        "nav.secondaryNavigation": "Navegación secundaria",
        "nav.siteNavigation": "Navegación del sitio",
        "nav.legalCredits": "Información legal y créditos",
        "nav.legalTransparency": "Transparencia legal",
        "nav.sections": "Navegación de secciones",
        "nav.sectionsOfPage": "Secciones de esta página",
        "nav.toggle": "Alternar navegación",
        "nav.hide": "Ocultar navegación",
        "nav.show": "Mostrar navegación",
        "scrollbar.label": "Desplazamiento de la página",
        "home.testimonialRole": "{role} de la {organization}",

        /* Menú (panel escalonado y megamenú) */
        "menu.open": "Menú",
        "menu.close": "Cerrar",
        "menu.allProjects": "Ver todos los proyectos",
        "menu.socials": "Síguenos",
        "menu.language": "Idioma",

        /* Selector de idioma */
        "lang.label": "Cambiar idioma",
        "lang.es": "Español",
        "lang.en": "English",
        "lang.esShort": "ES",
        "lang.enShort": "EN",

        /* Reloj del navbar */
        "clock.place": "Guayaquil, Ecuador",
        "clock.label": "Hora en Guayaquil",

        /* Pie de página */
        "footer.developedBy": "Desarrollado por",
        "footer.madeWith": "Hecho con",
        "footer.orgLegalInfo": "Información legal de la organización",
        "footer.socialNetworks": "Redes sociales",
        "footer.partnersCarousel": "Carrusel de logos de empresas colaboradoras",
        "footer.donateCta": "Aporta hoy 💜",

        /* Portada · «Cómo puedes ayudar». Son cadenas de interfaz: cada
           tarjeta desaparece con el componente que la pinta (HelpCta.astro). */
        "help.eyebrow": "Cómo puedes ayudar",
        "help.title": "Cada tambor *suena* porque alguien se sumó.",
        "help.body":
            "La Fundación Minkayni sostiene procesos formativos en doce sectores de Guayaquil con aportes, tiempo y alianzas de personas e instituciones que creen en el trabajo comunitario. Hay tres formas de entrar al compás.",
        "help.donateTitle": "Aporta hoy",
        "help.donateText": "Una donación cubre instrumentos, mantenimiento, procesos formativos y la logística de llegar a cada barrio. Publicamos en qué se usa cada aporte.",
        "help.donateLink": "Ver cómo aportar",
        "help.volunteerTitle": "Súmate como voluntario o voluntaria",
        "help.volunteerText": "Músicos, docentes, comunicadores y gente con ganas de acompañar: los ensayos y las jornadas en territorio siempre necesitan manos.",
        "help.volunteerLink": "Escríbenos",
        "help.partnerTitle": "Alianzas institucionales",
        "help.partnerText": "Empresas, universidades, colectivos y organismos de cooperación pueden financiar, acoger o replicar la metodología de la Batucada Popular.",
        "help.partnerLink": "Conversemos",
        "help.contactNote": "También puedes escribirnos por WhatsApp o correo. Respondemos desde Guayaquil, Ecuador.",
        "help.whatsapp": "WhatsApp",

        /* Novedades */
        "news.title": "Novedades",
        "news.metaDescription":
            "Lo que hace la Fundación Minkayni, contado cuando pasa: talleres en los barrios de Guayaquil, presentaciones de la Batucada Popular, alianzas y reconocimientos.",
        "news.eyebrow": "Desde el territorio",
        "news.lead":
            "Cada jornada en un barrio, cada presentación y cada alianza queda anotada aquí en cuanto ocurre. Son las mismas palabras con las que las contamos en nuestras redes, reunidas para que se puedan leer de corrido.",
        "news.updated": "Última novedad:",
        "news.count": "{count} publicaciones",
        "news.viewOriginal": "Ver la publicación original",
        "news.viewOriginalReel": "Ver el vídeo original",
        "news.likes": "{count} me gusta",
        "news.ctaTitle": "¿Quieres que esto siga sonando?",
        "news.ctaBody":
            "Cada taller, cada tambor y cada jornada en un barrio se sostiene con aportes de gente que cree en esto.",
        "news.ctaButton": "Aporta hoy 💜",
        "news.tags": "Etiquetas",
        "news.openPost": "Abrir la publicación",
        "news.postFallback": "Publicación {id}",
        "news.followTitle": "Síguenos y participa",
        "news.followBody":
            "Las novedades salen primero en nuestras redes: ahí anunciamos los ensayos abiertos, las presentaciones en los barrios y las convocatorias para sumarse. Si quieres que la Batucada Popular llegue a tu sector, a tu escuela o a tu institución, escríbenos y coordinamos una visita.",
        "news.followSocials": "Nuestras redes",
        "news.followContact": "Escríbenos para coordinar una visita",
        "news.followProjects": "Conoce los proyectos",
        "news.followImpact": "Mira el impacto en los territorios",
        "news.activitiesTitle": "Actividades en territorio",
        "news.activitiesLead": "Lo que hacemos cada semana en los barrios, contado por el equipo que estuvo ahí.",
        "news.featured": "Lo más reciente",
        "news.readActivity": "Leer la actividad",
        "news.filterLabel": "Filtrar actividades",
        "news.filterAll": "Todas",
        "news.filterYear": "Año",
        "news.brand.minkayni": "Fundación Minkayni",
        "news.brand.batucada": "Batucada Popular",
        "news.fromSocials": "Desde nuestras redes",
        "news.activityCount": "{count} actividades",
        "news.backToNews": "Todas las novedades",
        "news.gallery": "Galería",
        "news.video": "Video",
        "news.seeOnMap": "Ver en el mapa",
        "news.alsoOnSocials": "También en redes",
        "news.onInstagram": "Ver en Instagram",
        "news.onFacebook": "Ver en Facebook",
        "news.onTiktok": "Ver en TikTok",
        "news.onLinkedin": "Ver en LinkedIn",
        "news.aboutTitle.minkayni": "Sobre Fundación Minkayni",
        "news.aboutBody.minkayni": "Fundación Minkayni impulsa en Guayaquil procesos comunitarios que fortalecen la dignidad, la organización popular, la inclusión social y económica, la protección de derechos y la construcción de territorios más justos, seguros, solidarios y libres de violencia. Cada actividad que ves aquí la cuenta el equipo que estuvo en el barrio.",
        "news.aboutLink.minkayni": "Conoce la fundación",
        "news.aboutTitle.batucada": "Sobre la Batucada Popular",
        "news.aboutBody.batucada": "La Batucada Popular es el proyecto comunitario de Fundación Minkayni en Guayaquil. Desde 2020 reúne a más de 300 integrantes en 12 sectores alrededor de la percusión, la educación popular y la acción comunitaria: la percusión es el pretexto para encontrarnos y organizarnos.",
        "news.aboutLink.batucada": "Conoce la Batucada Popular",
        "news.previous": "Actividad anterior",
        "news.next": "Actividad siguiente",
        "news.pagination": "Páginas de publicaciones",
        "news.pageOf": "Página {page} de {total}",
        "news.pageTitle": "página {page}",
        "news.newer": "Más recientes",
        "news.older": "Anteriores",
        "intro.skip": "Saltar",

        /* Vista previa de borradores del constructor (panel de Strapi) */
        "preview.title": "Vista previa",
        "preview.badge": "Vista previa del borrador · sin publicar",
        "preview.loading": "Cargando el borrador…",
        "preview.errorAuth": "Este enlace de vista previa no es válido o ha caducado. Vuelve a abrirlo desde el panel de Strapi.",
        "preview.errorNotFound": "Este documento no existe o no tiene contenido en este idioma.",
        "preview.errorNetwork": "No se pudo leer el borrador desde el CMS.",

        /* Estados vacíos y de carga */
        "empty.description": "Sin descripción disponible.",
        "empty.posts": "Sin publicaciones disponibles.",
        "loading.map": "Cargando el mapa de los sectores…",

        /* Portada */
        "home.title": "Fundación Minkayni — Colaboración y reciprocidad",
        "home.danielQuote": "“Aprendí a tocar el tambor, a manejar mejor mi carácter y encontré buenos amigos.”",
        "home.danielAttribution": "Daniel · Integrante de Batucada Popular",
        "home.teamEyebrow": "Quiénes somos",
        "home.teamSubtitle": "Un equipo que cree en el trabajo compartido.",
        "home.teamBody": "Educación, arte y organización comunitaria se encuentran para acompañar a las juventudes y sostener procesos que nacen desde el territorio.",
        "home.teamCta": "Conoce a Minkayni",
        "home.linesOfAction": "Líneas de acción",

        /* Títulos de página. Se ven dos veces: en la pestaña del navegador y
           en el hero, así que no basta con traducir el `metaTitle` del CMS. */
        "page.impact": "Impacto",
        "page.projects": "Proyectos",
        "page.donate": "Aporta hoy",
        "page.batucada": "Batucada Popular",
        "page.batucadaHistory": "Historia — Batucada Popular",
        "page.batucadaEcosystem": "Ecosistema — Batucada Popular",

        /* Conócenos */
        "about.title": "Conócenos",
        "about.missionVision": "Misión y visión",
        "about.historyTimeline": "Historia de la fundación",
        "about.readIn": "Leer en {outlet}",
        "about.logoOf": "Logo de {name}",
        "about.approvedIn": "Aprobado en {meta}",
        "about.timeline": "Línea de tiempo",

        /* Proyectos */
        "projects.filter": "Filtrar proyectos y líneas de acción",
        "projects.alliesAndFunders": "Aliados y financiadores",
        "projects.visibleOne": "{count} resultado visible",
        "projects.visibleMany": "{count} resultados visibles",

        /* Batucada Popular */
        "batucada.timeline": "Línea de tiempo de la Batucada Popular",
        "batucada.jumpToPeriod": "Saltar a una época",
        "batucada.mapLabel": "Mapa de Guayaquil con los {count} sectores donde trabaja Batucada Popular",
        "batucada.navWhoWeAre": "Quiénes somos",
        "batucada.navHowWeWork": "Cómo trabajamos",
        "batucada.navWhereItSounds": "Dónde suena",
        "batucada.navBeyondRehearsal": "Más allá del ensayo",
        "batucada.mapReset": "Ver los {count} sectores",
        "batucada.mapError": "No pudimos cargar el mapa. Los {count} sectores siguen en la lista de al lado.",
        "batucada.photoOf": "Foto del sector {name}",

        /* Visor de fotos a pantalla completa (mapa de Batucada) */
        "viewer.label": "Visor de fotos",
        "viewer.open": "Ampliar la foto {index} de {count}",
        "viewer.close": "Cerrar el visor",
        "viewer.previous": "Foto anterior",
        "viewer.next": "Foto siguiente",
        "viewer.zoomIn": "Ampliar la foto",
        "viewer.zoomOut": "Ver la foto entera",
        "viewer.goTo": "Ver la foto {index}",
        "viewer.position": "{index} de {count}",

        /* Aviso de cookies */
        "cookies.label": "Aviso de cookies",
        "cookies.eyebrow": "Antes de seguir",
        "cookies.title": "¿Nos dejas medir la visita?",
        "cookies.body": "Medimos qué páginas sirven, con Google Analytics. Si prefieres que no, elige «Solo lo necesario»: la web funciona igual.",
        "cookies.accept": "Aceptar",
        "cookies.reject": "Solo lo necesario",
        "cookies.more": "Cómo tratamos los datos",
        "cookies.settings": "Preferencias de cookies",

        /* Donaciones */
        "donate.copyAll": "Copiar todos los datos",
        "donate.copied": "Datos copiados",
        "donate.wireDetails": "Datos del giro",
        "donate.shortcuts": "Atajos",
        "donate.copy": "Copiar",
        "donate.copiedShort": "Copiado",
        /* Sin concordancia de género: «Copiado: dirección del banco». */
        "donate.copiedItem": "Copiado: {label}.",
        "donate.copyFailed": "No se pudo copiar automáticamente. {label}: {value}",
        "donate.bank": "Banco",
        "donate.accountType": "Tipo de cuenta",
        "donate.accountNumber": "Número de cuenta",
        "donate.holder": "Titular",
        "donate.taxId": "RUC",
        "donate.swift": "Código SWIFT / BIC",
        "donate.holderAddress": "Dirección del titular",
        "donate.bankAddress": "Dirección del banco",
        "donate.currency": "Moneda",

        /* Transparencia: etiquetas de la ficha legal. Los valores NO se
           traducen —son los que constan en los registros del Estado— pero
           las etiquetas sí, porque son las que lee quien verifica. */
        "legal.legalName": "Nombre legal",
        "legal.ruc": "RUC",
        "legal.personality": "Personería jurídica",
        "legal.suios": "Registro SUIOS",
        "legal.legalForm": "Naturaleza jurídica",
        "legal.status": "Estado de la organización",
        "legal.incorporation": "Fecha de constitución",
        "legal.representative": "Representante legal",
        "legal.board": "Directiva registrada",
        "legal.activity": "Actividad económica (CIIU)",

        /* Transparencia */
        "transparency.address": "Domicilio y contacto oficial",
        "transparency.physicalAddress": "Dirección física",
        "transparency.email": "Correo institucional",
        "transparency.website": "Sitio web oficial",
        "transparency.phone": "Teléfono",
        "transparency.officialSources": "Verificación en fuentes oficiales",
        "transparency.opensNewTab": "(se abre en una pestaña nueva)",
        "transparency.opensPdf": "(documento PDF, se abre en una pestaña nueva)",
        "transparency.domainOwnership": "El dominio {domain} es propiedad de {legalName}, RUC {ruc}, registro SUIOS {suios}.",
        "transparency.documents": "Documentos oficiales",
        "transparency.certificates": "Los certificados originales se entregan bajo solicitud para procesos de verificación y debida diligencia.",

        /* 404 */
        "notFound.title": "Página no encontrada",
        "notFound.tagline": "se salió del compás",
        "notFound.eyebrow": "Error 404",
        "notFound.headingBefore": "Esta página",
        "notFound.description": "La página que buscas no existe o cambió de dirección. Vuelve al inicio de Fundación Minkayni o explora los proyectos, el impacto y la información legal de la fundación.",
        "notFound.body": "La dirección que buscas no existe, cambió de nombre o el enlace llegó incompleto. El tambor sigue sonando en el resto del sitio: elige por dónde seguir.",
        "notFound.shortcuts": "Secciones principales del sitio",
        "notFound.contactBefore": "¿Llegaste aquí desde un enlace nuestro? Escríbenos a",
        "notFound.contactAfter": "y lo arreglamos.",
        "notFound.homeText": "Volver al principio",
        "notFound.aboutText": "Quiénes somos y cómo trabajamos",
        "notFound.projectsTitle": "Proyectos",
        "notFound.projectsText": "La Batucada Popular y todo su ecosistema",
        "notFound.impactTitle": "Impacto",
        "notFound.impactText": "Resultados verificados en los territorios",
        "notFound.donateTitle": "Aporta hoy",
        "notFound.donateText": "Suma tu donación al proyecto",
        "notFound.transparencyText": "Datos legales de la fundación",

        /* Textos alternativos de imágenes fijas del repositorio */
        "alt.batucadaIntervention": "Batucada Popular – intervención cultural en Guayaquil",
        "alt.celebrating": "Integrantes de la Batucada Popular celebrando tras una presentación",
        "alt.marching": "Jóvenes marchando con tambores en el centro de Guayaquil",
        "alt.withTeam": "Integrantes de Batucada Popular junto al equipo de MINKAYNI",
        "alt.daniel": "Daniel, integrante de la Batucada Popular",
        "alt.performing": "Integrantes de Batucada Popular en presentación",
        "alt.logo": "Logotipo de la Fundación Minkayni",
        "alt.teamMember": "Integrante del equipo de la fundación",
        "alt.reel": "Vídeo",
        /* Las fotos de Batucada son medios del CMS, pero su texto alternativo
           no tiene campo propio allí (el de la Media Library no se traduce),
           así que vive aquí. */
        "alt.batucadaHero": "Jóvenes de Batucada Popular tocando tambores durante una presentación",
        "alt.batucadaPulse": "Integrantes de Batucada Popular compartiendo juntas después de una presentación",
        "alt.batucadaSense": "Jóvenes de Batucada Popular marchando con sus tambores en una calle de Guayaquil",
    },

    en: {
        /* Navigation and menu */
        "nav.home": "Home",
        "nav.goHome": "Go to the homepage",
        "nav.submenuOf": "{title} submenu",
        "nav.mainNavigation": "Main navigation",
        "nav.secondaryNavigation": "Secondary navigation",
        "nav.siteNavigation": "Site navigation",
        "nav.legalCredits": "Legal information and credits",
        "nav.legalTransparency": "Legal transparency",
        "nav.sections": "Section navigation",
        "nav.sectionsOfPage": "Sections on this page",
        "nav.toggle": "Toggle navigation",
        "nav.hide": "Hide navigation",
        "nav.show": "Show navigation",
        "scrollbar.label": "Page scroll",
        "home.testimonialRole": "{role} of the {organization}",

        /* Menu (staggered panel and mega menu) */
        "menu.open": "Menu",
        "menu.close": "Close",
        "menu.allProjects": "See all projects",
        "menu.socials": "Follow us",
        "menu.language": "Language",

        /* Language switcher */
        "lang.label": "Change language",
        "lang.es": "Español",
        "lang.en": "English",
        "lang.esShort": "ES",
        "lang.enShort": "EN",

        /* Navbar clock */
        "clock.place": "Guayaquil, Ecuador",
        "clock.label": "Local time in Guayaquil",

        /* Footer */
        "footer.developedBy": "Built by",
        "footer.madeWith": "Made with",
        "footer.orgLegalInfo": "Legal information about the organisation",
        "footer.socialNetworks": "Social networks",
        "footer.partnersCarousel": "Carousel of partner organisation logos",
        "footer.donateCta": "Give today 💜",

        /* Homepage · "How you can help" */
        "help.eyebrow": "How you can help",
        "help.title": "Every drum *sounds* because someone joined in.",
        "help.body":
            "The Minkayni Foundation keeps training processes running in twelve neighbourhoods of Guayaquil thanks to donations, time and partnerships from people and institutions who believe in community work. There are three ways to join the beat.",
        "help.donateTitle": "Give today",
        "help.donateText": "A donation covers instruments, maintenance, training processes and the logistics of reaching every neighbourhood. We publish what each contribution is used for.",
        "help.donateLink": "See how to give",
        "help.volunteerTitle": "Join as a volunteer",
        "help.volunteerText": "Musicians, teachers, communicators and anyone willing to accompany: rehearsals and sessions in the neighbourhoods always need hands.",
        "help.volunteerLink": "Write to us",
        "help.partnerTitle": "Institutional partnerships",
        "help.partnerText": "Companies, universities, collectives and cooperation agencies can fund, host or replicate the Batucada Popular methodology.",
        "help.partnerLink": "Let's talk",
        "help.contactNote": "You can also reach us on WhatsApp or by email. We reply from Guayaquil, Ecuador.",
        "help.whatsapp": "WhatsApp",

        /* News */
        "news.title": "News",
        "news.metaDescription":
            "What the Minkayni Foundation does, told as it happens: workshops in the neighbourhoods of Guayaquil, Batucada Popular performances, partnerships and awards.",
        "news.eyebrow": "From the territory",
        "news.lead":
            "Every session in a neighbourhood, every performance and every partnership is recorded here as it happens. These are the same words we use to tell it on our social channels, kept in the original Spanish and gathered so they can be read in one go.",
        "news.updated": "Latest entry:",
        "news.count": "{count} posts",
        "news.viewOriginal": "See the original post",
        "news.viewOriginalReel": "Watch the original video",
        "news.likes": "{count} likes",
        "news.ctaTitle": "Want to keep this sounding?",
        "news.ctaBody":
            "Every workshop, every drum and every session in a neighbourhood is held up by people who believe in this.",
        "news.ctaButton": "Give today 💜",
        "news.tags": "Tags",
        "news.openPost": "Open the post",
        "news.postFallback": "Post {id}",
        "news.followTitle": "Follow us and take part",
        "news.followBody":
            "News breaks first on our social channels: that is where we announce open rehearsals, performances in the neighbourhoods and calls to join. If you want Batucada Popular to reach your neighbourhood, your school or your organisation, write to us and we will arrange a visit.",
        "news.followSocials": "Our channels",
        "news.followContact": "Write to us to arrange a visit",
        "news.followProjects": "Discover the projects",
        "news.followImpact": "See the impact in the neighbourhoods",
        "news.activitiesTitle": "Activities in the neighbourhoods",
        "news.activitiesLead": "What we do every week in the neighbourhoods, told by the team who was there.",
        "news.featured": "Latest",
        "news.readActivity": "Read the story",
        "news.filterLabel": "Filter activities",
        "news.filterAll": "All",
        "news.filterYear": "Year",
        "news.brand.minkayni": "Fundación Minkayni",
        "news.brand.batucada": "Batucada Popular",
        "news.fromSocials": "From our social channels",
        "news.activityCount": "{count} activities",
        "news.backToNews": "All news",
        "news.gallery": "Gallery",
        "news.video": "Video",
        "news.seeOnMap": "See on the map",
        "news.alsoOnSocials": "Also on social media",
        "news.onInstagram": "See on Instagram",
        "news.onFacebook": "See on Facebook",
        "news.onTiktok": "See on TikTok",
        "news.onLinkedin": "See on LinkedIn",
        "news.aboutTitle.minkayni": "About Fundación Minkayni",
        "news.aboutBody.minkayni": "Fundación Minkayni drives community processes in Guayaquil that strengthen dignity, grassroots organisation, social and economic inclusion, the protection of rights and the building of fairer, safer, more caring neighbourhoods free from violence. Every activity you see here is told by the team who was there.",
        "news.aboutLink.minkayni": "Meet the foundation",
        "news.aboutTitle.batucada": "About Batucada Popular",
        "news.aboutBody.batucada": "Batucada Popular is Fundación Minkayni's community project in Guayaquil. Since 2020 it has brought together more than 300 members in 12 neighbourhoods around percussion, popular education and community action: the drums are the excuse to meet and organise.",
        "news.aboutLink.batucada": "Discover Batucada Popular",
        "news.previous": "Previous activity",
        "news.next": "Next activity",
        "news.pagination": "Post pages",
        "news.pageOf": "Page {page} of {total}",
        "news.pageTitle": "page {page}",
        "news.newer": "Newer",
        "news.older": "Older",
        "intro.skip": "Skip",

        /* Draft preview (Strapi panel) */
        "preview.title": "Preview",
        "preview.badge": "Draft preview · not published",
        "preview.loading": "Loading the draft…",
        "preview.errorAuth": "This preview link is invalid or has expired. Open it again from the Strapi panel.",
        "preview.errorNotFound": "This document doesn't exist or has no content in this language.",
        "preview.errorNetwork": "The draft could not be loaded from the CMS.",

        /* Empty and loading states */
        "empty.description": "No description available.",
        "empty.posts": "No posts available.",
        "loading.map": "Loading the map of neighbourhoods…",

        /* Homepage */
        "home.title": "Minkayni Foundation — Collaboration and reciprocity",
        "home.danielQuote": "“I learned to play the drum, to handle my temper better, and I found good friends.”",
        "home.danielAttribution": "Daniel · Batucada Popular member",
        "home.teamEyebrow": "Who we are",
        "home.teamSubtitle": "A team that believes in working together.",
        "home.teamBody": "Education, art and community organising come together to accompany young people and sustain processes that are born in the territory itself.",
        "home.teamCta": "Get to know Minkayni",
        "home.linesOfAction": "Lines of action",

        /* Page titles. They appear twice: in the browser tab and in the hero,
           so translating the CMS `metaTitle` alone is not enough. */
        "page.impact": "Impact",
        "page.projects": "Projects",
        "page.donate": "Give today",
        "page.batucada": "Batucada Popular",
        "page.batucadaHistory": "History — Batucada Popular",
        "page.batucadaEcosystem": "Ecosystem — Batucada Popular",

        /* About */
        "about.title": "About us",
        "about.missionVision": "Mission and vision",
        "about.historyTimeline": "History of the foundation",
        "about.readIn": "Read in {outlet}",
        "about.logoOf": "{name} logo",
        "about.approvedIn": "Approved in {meta}",
        "about.timeline": "Timeline",

        /* Projects */
        "projects.filter": "Filter projects and lines of action",
        "projects.alliesAndFunders": "Allies and funders",
        "projects.visibleOne": "{count} result shown",
        "projects.visibleMany": "{count} results shown",

        /* Batucada Popular */
        "batucada.timeline": "Batucada Popular timeline",
        "batucada.jumpToPeriod": "Jump to a period",
        "batucada.mapLabel": "Map of Guayaquil showing the {count} sectors where Batucada Popular works",
        "batucada.navWhoWeAre": "Who we are",
        "batucada.navHowWeWork": "How we work",
        "batucada.navWhereItSounds": "Where it plays",
        "batucada.navBeyondRehearsal": "Beyond rehearsal",
        "batucada.mapReset": "See all {count} sectors",
        "batucada.mapError": "We couldn't load the map. The {count} sectors are still in the list beside it.",
        "batucada.photoOf": "Photo of the {name} sector",

        /* Full-screen photo viewer (Batucada map) */
        "viewer.label": "Photo viewer",
        "viewer.open": "Enlarge photo {index} of {count}",
        "viewer.close": "Close the viewer",
        "viewer.previous": "Previous photo",
        "viewer.next": "Next photo",
        "viewer.zoomIn": "Zoom in",
        "viewer.zoomOut": "Fit the whole photo",
        "viewer.goTo": "See photo {index}",
        "viewer.position": "{index} of {count}",

        /* Cookie notice */
        "cookies.label": "Cookie notice",
        "cookies.eyebrow": "Before you carry on",
        "cookies.title": "May we measure this visit?",
        "cookies.body": "We measure which pages are useful, with Google Analytics. If you would rather not, choose “Only what\u2019s needed”: the site works just the same.",
        "cookies.accept": "Accept",
        "cookies.reject": "Only what's needed",
        "cookies.more": "How we handle data",
        "cookies.settings": "Cookie preferences",

        /* Donations */
        "donate.copyAll": "Copy all details",
        "donate.copied": "Details copied",
        "donate.wireDetails": "Wire details",
        "donate.shortcuts": "Shortcuts",
        "donate.copy": "Copy",
        "donate.copiedShort": "Copied",
        "donate.copiedItem": "Copied: {label}.",
        "donate.copyFailed": "Couldn't copy automatically. {label}: {value}",
        "donate.bank": "Bank",
        "donate.accountType": "Account type",
        "donate.accountNumber": "Account number",
        "donate.holder": "Account holder",
        /* El nombre del registro se conserva: es lo que pide el banco. */
        "donate.taxId": "Tax ID (RUC)",
        "donate.swift": "SWIFT / BIC code",
        "donate.holderAddress": "Account holder's address",
        "donate.bankAddress": "Bank address",
        "donate.currency": "Currency",

        /* Transparency: labels of the legal record. The values are NOT
           translated —they are what the state registries hold— but the
           labels are, because they are what a verifier reads. */
        "legal.legalName": "Legal name",
        "legal.ruc": "Tax ID (RUC)",
        "legal.personality": "Legal personality",
        "legal.suios": "SUIOS registration",
        "legal.legalForm": "Legal form",
        "legal.status": "Status of the organisation",
        "legal.incorporation": "Date of incorporation",
        "legal.representative": "Legal representative",
        "legal.board": "Registered board",
        "legal.activity": "Economic activity (ISIC)",

        /* Transparency */
        "transparency.address": "Registered address and official contact",
        "transparency.physicalAddress": "Street address",
        "transparency.email": "Institutional email",
        "transparency.website": "Official website",
        "transparency.phone": "Phone",
        "transparency.officialSources": "Verification against official sources",
        "transparency.opensNewTab": "(opens in a new tab)",
        "transparency.opensPdf": "(PDF document, opens in a new tab)",
        "transparency.domainOwnership": "The domain {domain} is owned by {legalName}, RUC {ruc}, SUIOS registration {suios}.",
        "transparency.documents": "Official documents",
        "transparency.certificates": "Original certificates are provided on request for verification and due diligence processes.",

        /* 404 */
        "notFound.title": "Page not found",
        "notFound.tagline": "lost the beat",
        "notFound.eyebrow": "Error 404",
        "notFound.headingBefore": "This page",
        "notFound.description": "The page you are looking for does not exist or has moved. Go back to the Minkayni Foundation homepage, or explore the projects, the impact and the foundation's legal information.",
        "notFound.body": "The address you are after does not exist, changed name, or the link arrived incomplete. The drum is still playing everywhere else on the site: pick where to carry on.",
        "notFound.shortcuts": "Main sections of the site",
        "notFound.contactBefore": "Did you get here from a link of ours? Write to us at",
        "notFound.contactAfter": "and we will fix it.",
        "notFound.homeText": "Back to the start",
        "notFound.aboutText": "Who we are and how we work",
        "notFound.projectsTitle": "Projects",
        "notFound.projectsText": "Batucada Popular and its whole ecosystem",
        "notFound.impactTitle": "Impact",
        "notFound.impactText": "Verified results across the neighbourhoods",
        "notFound.donateTitle": "Give today",
        "notFound.donateText": "Add your donation to the project",
        "notFound.transparencyText": "The foundation's legal details",

        /* Alt text for images that live in the repository */
        "alt.batucadaIntervention": "Batucada Popular – a cultural intervention in Guayaquil",
        "alt.celebrating": "Batucada Popular members celebrating after a performance",
        "alt.marching": "Young people marching with drums through central Guayaquil",
        "alt.withTeam": "Batucada Popular members alongside the MINKAYNI team",
        "alt.daniel": "Daniel, a member of Batucada Popular",
        "alt.performing": "Batucada Popular members performing",
        "alt.logo": "Minkayni Foundation logo",
        "alt.teamMember": "Member of the foundation team",
        "alt.reel": "Video",
        "alt.batucadaHero": "Young Batucada Popular members playing drums during a performance",
        "alt.batucadaPulse": "Batucada Popular members spending time together after a performance",
        "alt.batucadaSense": "Young Batucada Popular members marching with their drums along a street in Guayaquil",
    },
} as const;

export type UiKey = keyof (typeof ui)["es"];
