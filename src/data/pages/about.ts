/* Fallback local de /about (Conócenos).
   Es el contenido publicado hoy; si el single type `about-page` de Strapi
   trae datos, estos se mezclan por encima con withFallback(). */
import type { ImageMetadata } from "astro";
import type { CmsMedia } from "./types";
import type { OrgCard } from "../../schemas/pages.zod";
import foto from "../../assets/FOTO_BATUCADA.webp";
import comunidad from "../../assets/batucada-popular/comunidad.webp";
import marcha from "../../assets/batucada-popular/marcha.webp";
import pandemia from "../../assets/historyimage.webp";
import eu from "../../assets/eu.png";
import vistazo from "../../assets/vistazo.png";

export const aboutFallback = {
    intro: {
        eyebrow: "Fundación MINKAYNI",
        title: "Desde los barrios\n*también se produce* futuro.",
        body: "Somos una organización social ecuatoriana, sin fines de lucro, nacida en el Suburbio de Guayaquil. Nuestro nombre une dos palabras kichwas: *minka*, el trabajo colectivo, y *ayni*, la reciprocidad entre iguales; nadie transforma un barrio solo. Con más de quince años de trayectoria territorial de nuestro equipo, acompañamos a niñas, niños, adolescentes, jóvenes y familias mediante el arte, la educación popular y la organización comunitaria.",
    },
    actionLines: [
        {
            title: "Fortalecimiento juvenil",
            description: "Arte, cultura y liderazgo para que las juventudes defiendan sus derechos y construyan paz en sus territorios.",
        },
        {
            title: "Economía popular y solidaria",
            description: "Formación y acompañamiento a emprendimientos asociativos que generan ingresos dignos en los barrios.",
        },
        {
            title: "Participación ciudadana",
            description: "Liderazgo social, organización barrial e incidencia en la política pública desde las voces de los territorios.",
        },
    ],
    historyHeading: {
        eyebrow: "Nuestra historia",
        title: "Una trayectoria que empezó mucho antes del primer tambor.",
    },
    timeline: [
        {
            chip: "2010",
            period: "2010 – 2015",
            title: "Primeros aprendizajes comunitarios",
            text: "Quienes hoy impulsamos MINKAYNI comenzamos en los barrios populares de Guayaquil junto a NURTAC, trabajando con niñez en situación de calle, personas adultas mayores, personas con discapacidad y madres jefas de hogar. Ahí aprendimos organización barrial y educación popular.",
            image: null as CmsMedia,
            imageAlt: "",
            localImage: undefined as ImageMetadata | undefined,
        },
        {
            chip: "2016",
            period: "2016 – 2019",
            title: "Consolidación del trabajo territorial",
            text: "Desde Fundación Terranueva profundizamos el trabajo con mujeres, juventudes y liderazgos comunitarios, y construimos los primeros vínculos con la cooperación internacional. Confirmamos algo esencial: los barrios ya tienen capacidades, conocimientos y redes de solidaridad propias.",
            image: null as CmsMedia,
            imageAlt: "",
            localImage: undefined as ImageMetadata | undefined,
        },
        {
            chip: "2019",
            period: "2019",
            title: "Los primeros tambores",
            text: "Johanna Chévez y Xavier Moreira impulsaron las primeras batucadas con palos, baldes y barriles reciclados. Junto a la Colectiva Batambá, un proceso feminista comunitario de madres de los barrios, la percusión se volvió una forma de tomar la palabra y ocupar el espacio público.",
            image: null as CmsMedia,
            imageAlt: "",
            localImage: undefined as ImageMetadata | undefined,
        },
        {
            chip: "2020",
            period: "2020",
            title: "Nace la Fundación MINKAYNI",
            text: "En plena pandemia nos constituimos jurídicamente como fundación sin fines de lucro, con domicilio en Guayaquil y alcance nacional. Tomamos el nombre de dos palabras del kichwa: “minka”, el trabajo colectivo por el bien común, y “ayni”, la reciprocidad de dar y recibir entre iguales. La música ayudó a reencontrarse cuando el miedo vaciaba las calles.",
            image: null as CmsMedia,
            imageAlt: "Niñas y niños de la batucada tocando baldes reciclados como tambores durante la pandemia",
            localImage: pandemia,
        },
        {
            chip: "2021",
            period: "2021 – 2023",
            title: "Respuesta comunitaria frente a la violencia",
            text: "Ante el aumento de la violencia armada y del riesgo de reclutamiento de niñas, niños y adolescentes, la Batucada Popular se transformó en una estrategia permanente de prevención, protección y organización juvenil, con formación en derechos y acompañamiento socioemocional.",
            image: null as CmsMedia,
            imageAlt: "Jóvenes de la Batucada Popular marchando con sus tambores por el centro de Guayaquil",
            localImage: marcha,
        },
        {
            chip: "2024",
            period: "2024",
            title: "Reconocimiento internacional",
            text: "El Fondo de Resiliencia de la Global Initiative Against Transnational Organized Crime (GI-TOC, Ginebra) seleccionó a Batucadas Populares para su fellowship 2024, entre cientos de propuestas de todo el mundo. Se fortalecieron las alianzas con PNUD, GIZ, Misión Alianza y Fundación Terranueva.",
            image: null as CmsMedia,
            imageAlt: "",
            localImage: undefined as ImageMetadata | undefined,
        },
        {
            chip: "2025",
            period: "2025",
            title: "Pensamiento, comunicación y expansión",
            text: "FLACSO Ecuador acogió el conversatorio “Batucada Popular de Guayaquil: arte y violencia”, ONU Mujeres nos convocó entre las seis organizaciones del proyecto Construimos Paz, nació Radio Sin Paro y la red superó los 300 integrantes en 12 sectores, sosteniendo el proceso incluso en los momentos más duros de la violencia en la ciudad.",
            image: null as CmsMedia,
            imageAlt: "Integrantes de la batucada con camisetas de la obra “Sueños que suenan, batucada que transforma”",
            localImage: comunidad,
        },
        {
            chip: "2026",
            period: "2026",
            title: "Fortalecimiento institucional",
            text: "Aprobamos nuestro Manual Institucional MEAL, firmamos un acuerdo de cooperación con la OIM, proyectamos el Centro de Articulación e Innovación Social en Paraíso de la Flor y comenzamos a tejer una red latinoamericana de iniciativas juveniles frente a la violencia.",
            image: null as CmsMedia,
            imageAlt: "Presentación de la Batucada Popular",
            localImage: foto,
        },
    ],
    mission: {
        title: "Misión",
        description:
            "Proponer y ejecutar programas, proyectos y servicios orientados a la inclusión económica y social de niñas, niños, adolescentes, jóvenes, personas adultas mayores, personas con discapacidad y poblaciones en situación de pobreza, exclusión o vulnerabilidad; promoviendo el desarrollo integral, el cuidado durante todo el ciclo de vida, la movilidad social ascendente, el fortalecimiento comunitario y la economía popular y solidaria, desde un enfoque de derechos, equidad, participación, interculturalidad y justicia social.",
    },
    vision: {
        title: "Visión",
        description:
            "Ser una organización social referente en Guayaquil y el Ecuador por impulsar procesos comunitarios sostenibles que fortalezcan la dignidad, la organización popular, la inclusión social y económica, la protección de derechos y la construcción de territorios más justos, seguros, solidarios y libres de violencia.",
    },
    ecosystemHeading: {
        eyebrow: "Un ecosistema comunitario",
        title: "La percusión es el pretexto para encontrarnos y organizarnos.",
        body: "Alrededor de la Batucada Popular hemos construido un ecosistema de organizaciones y estrategias que se sostienen mutuamente: investigación, organización adulta, comunicación popular y formación política.",
    },
    ecosystemCards: [
        {
            name: "Batucada Popular",
            kind: "Proyecto insignia",
            text: "Colectivos juveniles de percusión que previenen el reclutamiento forzado y recuperan el espacio público en 12 sectores de Guayaquil.",
            accentColor: "var(--primary)",
            dark: true,
        },
        {
            name: "CESCU",
            kind: "Investigación",
            text: "Centro de estudios dirigido por Camila Martínez, que investiga el conflicto urbano desde la experiencia de las juventudes y las madres de los barrios, en articulación con FLACSO.",
            accentColor: "var(--secondary)",
            dark: false,
        },
        {
            name: "Movimiento de Barrios Organizados",
            kind: "Organización adulta",
            text: "Madres de familia y lideresas populares que discuten la ciudad desde los propios barrios, con autonomía frente a agendas electorales.",
            accentColor: "var(--accent)",
            dark: false,
        },
        {
            name: "Radio Sin Paro",
            kind: "Comunicación popular",
            text: "Plataforma juvenil de radio y contenidos que disputa las narrativas sobre los barrios, ganadora de la convocatoria Radio Activa de la Casa de la Cultura.",
            accentColor: "#dedbd4",
            dark: false,
        },
    ] as OrgCard[],
    ecosystemLink: { text: "Recorre el ecosistema desde dentro", href: "/projects/batucada-popular/ecosistema" },
    teamHeading: {
        eyebrow: "Quiénes lo hacemos posible",
        title: "Un equipo nacido en los mismos barrios que acompaña.",
    },
    teamMembers: [
        {
            title: "Johanna Chévez Contreras",
            description:
                "Cofundadora y vicepresidenta. Educadora popular y feminista comunitaria; diseña la metodología, la formación y el acompañamiento territorial de la Batucada Popular desde sus inicios.",
        },
        {
            title: "Xavier Moreira Flores",
            description:
                "Cofundador, presidente y representante legal. Sociólogo con más de 15 años en programas sociales y de cooperación; certificado en Prevención de la Explotación y el Abuso Sexuales (UNICEF–Agora, 2026).",
        },
    ],
    teamNote:
        "El equipo técnico y operativo está integrado por jóvenes de 19 a 25 años de Socio Vivienda, Sergio Toral, Bastión Popular, Flor de Bastión, el Suburbio, Isla Trinitaria y Guasmo, con equidad de género: el relevo generacional no es un discurso, es nuestra estructura.",
    transparencyHeading: {
        eyebrow: "Transparencia y gobernanza",
        title: "Preparados para trabajar con la cooperación internacional.",
        body: "Estamos legalmente constituidos desde 2020 (Resolución MIES-CZ-8-DDG1-2020-0059-R) y registrados ante el Ministerio de Gobierno del Ecuador. Contamos con un acuerdo de cooperación con la OIM (2025), convenios con seis universidades —Universidad de Guayaquil, Casa Grande, Católica de Santiago de Guayaquil, Universidad de las Artes, ESPOL y Bolivariana— y un sistema institucional de políticas que se revisa periódicamente.",
    },
    policies: [
        { text: "Código de Ética y Conducta", meta: "2023" },
        { text: "Manual Antifraude y Anticorrupción", meta: "2023" },
        { text: "Ruta de Atención ante Violencia Basada en Género", meta: "2023" },
        { text: "Manual de Salvaguarda y PSEA", meta: "2025" },
        { text: "Manual Institucional MEAL", meta: "2026" },
        { text: "Manual de Protección de Datos", meta: "2026" },
        { text: "Mecanismo de Quejas y Denuncias", meta: "2026" },
        { text: "Manual de Seguridad en Territorio y Eventos", meta: "2026" },
    ],
    transparencyNote:
        "Nuestro Manual Institucional MEAL (monitoreo, evaluación, aprendizaje y rendición de cuentas) nos compromete a registrar resultados, escuchar a las poblaciones participantes y rendir cuentas ante comunidades y organizaciones aliadas, con informes periódicos de ingresos y gastos.",
    pressHeading: {
        eyebrow: "Lo que se dice de nosotros",
        title: "Una historia que ya cuenta el país.",
        body: "Medios nacionales han documentado cómo el tambor se convirtió en refugio y en estrategia de prevención del reclutamiento en Guayaquil. Las cifras, los reconocimientos y todas esas historias viven en su propia página.",
    },
    pressLinks: [
        {
            outlet: "El Universo",
            href: "https://www.eluniverso.com/noticias/informes/con-la-batucada-despejo-la-mente-y-me-alejo-de-robar-plan-de-serpaz-busca-que-los-jovenes-no-sean-reclutados-por-las-bandas-nota/",
            logo: null as CmsMedia,
            localLogo: eu as ImageMetadata | undefined,
            logoClass: "w-16",
        },
        {
            outlet: "Vistazo",
            href: "https://www.vistazo.com/actualidad/nacional/2026-03-08-historia-mujer-convirtio-tambores-refugio-jovenes-violencia-guayaquil-GG10707818",
            logo: null as CmsMedia,
            localLogo: vistazo as ImageMetadata | undefined,
            logoClass: "w-14",
        },
    ],
    pressCta: { text: "Mira nuestro impacto", href: "/impact" },
    contactHeading: {
        eyebrow: "Hagamos minka",
        title: "El ritmo crece cuando alguien más se suma.",
        body: "Si representas a una organización de cooperación, una empresa, una universidad o un organismo internacional, conversemos: cada alianza sostiene liderazgo juvenil, arte comunitario y construcción de paz desde los barrios populares de Guayaquil.",
    },
    contactButton: { href: "mailto:info@minkayni.org", defaultText: "Escríbenos 💌", hoverText: "Hagamos minka 🥁" },
    contactSecondary: { text: "Síguenos en Instagram", href: "https://www.instagram.com/batucada_popular_/" },
    /* Meta description propia: sin ella todas las páginas heredaban la
       descripción global y competían entre sí en los buscadores. */
    seo: { metaDescription: "Organización social ecuatoriana sin fines de lucro nacida en el Suburbio de Guayaquil: arte, educación popular y organización comunitaria con niñez y juventudes." },
};
