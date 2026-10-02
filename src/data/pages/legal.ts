/* Fallback local del single type `legal-transparency` (Transparencia legal).

   Los valores están tomados LITERALMENTE de los documentos oficiales:
   - RUC y razón social .......... Certificado de RUC (SRI), 15 sep 2026
   - Constitución ................ Resolución MIES-CZ-8-DDG1-2020-0059-R (30 jun 2020)
   - Registro SUIOS .............. Constancia de Registro, Ministerio de Gobierno
   - Directiva ................... Oficio MIES-CZ-8-DDGM-2024-1822-OF (18 nov 2024)

   Si cambian, se editan en Strapi (Contenido → Transparencia legal) y este
   archivo queda solo como respaldo cuando el CMS no responde. */

export const legalFallback = {
    /* Etiqueta corta del bloque en el footer */
    eyebrow: "Transparencia legal",
    title: "Organización legalmente constituida en el Ecuador",
    intro: "Fundación MINKAYNI es una organización no gubernamental (ONG) sin fines de lucro, de derecho privado y finalidad social, con personería jurídica otorgada por el Estado ecuatoriano y registro vigente en el Sistema Unificado de Información de las Organizaciones Sociales (SUIOS).",

    /* Identidad legal — campos que revisan las plataformas de verificación */
    legalName: "FUNDACIÓN MINKAYNI",
    tradeName: "Fundación Minkayni",
    ruc: "0993333182001",
    legalForm: "Fundación sin fines de lucro (ONG)",
    legalStatus: "Activa — estado tributario ACTIVO (SRI) y “Registrada” en el SUIOS",
    ministryResolution: "Resolución No. MIES-CZ-8-DDG1-2020-0059-R, de 30 de junio de 2020, emitida por el Ministerio de Inclusión Económica y Social (MIES)",
    incorporationDate: "30 de junio de 2020",
    suiosCode: "0000130796 — Sistema Unificado de Organizaciones Sociales (SUIOS), Ministerio de Gobierno",
    boardRegistration: "Oficio No. MIES-CZ-8-DDGM-2024-1822-OF, de 18 de noviembre de 2024 (directiva registrada para el período 3 de julio de 2024 – 3 de julio de 2028)",
    legalRepresentative: "Héctor Xavier Moreira Flores, Presidente y representante legal",
    economicActivity: "S94110001 — Actividades de organizaciones sin fines de lucro para el desarrollo de una determinada zona geográfica",

    /* Contacto oficial */
    addressStreet: "Calle 44 ava N.° 817, entre Rosendo Avilés y Chambers",
    addressLocality: "Parroquia Febres Cordero, Guayaquil",
    addressRegion: "Guayas",
    addressCountry: "Ecuador",
    email: "info@minkayni.org",
    /* Teléfono institucional: el mismo número que el sitio ya publica en
       /donar y /batucada (global.ts → whatsappUrl). Se repite a propósito —
       un verificador que cruce el sitio con el registro debe encontrar
       SIEMPRE el mismo número, no uno distinto por página. */
    phone: "+593 98 526 1647",
    website: "https://minkayni.org",

    /* Datos adicionales opcionales (repetible en el CMS) */
    records: [] as Array<{ label?: string | null; value?: string | null }>,

    /* Enlaces de verificación pública (consultas oficiales del Estado) */
    verificationLinks: [
        { text: "Consultar el RUC en el SRI", href: "https://srienlinea.sri.gob.ec/sri-en-linea/SriRucWeb/ConsultaRuc/Consultas/consultaRuc" },
        { text: "Consultar el registro en el SUIOS", href: "https://www.sociedadcivil.gob.ec/" },
    ],

    /* Documentos publicados (se cargan como PDF en el CMS) */
    documents: [] as Array<{ title?: string | null; note?: string | null; file?: { url?: string | null; name?: string | null } | null }>,

    /* Nota legal al pie del bloque */
    note: "Los certificados originales (RUC, constancia de registro SUIOS, registro de directiva y estatutos) están disponibles para procesos de verificación, auditoría y debida diligencia. Solicítalos a info@minkayni.org.",

    /* Enlace del footer hacia la página completa */
    pageLink: { text: "Transparencia legal", href: "/transparencia" },

    seo: {
        metaTitle: "Transparencia legal · Fundación Minkayni",
        metaDescription: "Datos legales verificables de Fundación MINKAYNI: RUC 0993333182001, resolución MIES-CZ-8-DDG1-2020-0059-R, registro SUIOS 0000130796, domicilio y contacto oficial en Guayaquil, Ecuador.",
    },
};

export type LegalContent = typeof legalFallback;

/* Versión en inglés.

   Solo cambia la prosa. Los valores de identidad —razón social, RUC, número
   de resolución, código SUIOS, dirección— se repiten IGUALES a propósito: son
   los que constan en los registros del Estado ecuatoriano, y traducirlos haría
   que no coincidieran con el documento que un verificador tiene delante. Por
   la misma razón `legalName` sigue siendo FUNDACIÓN MINKAYNI.

   Esta página no existe todavía como documento en Strapi, así que hoy este
   fallback ES el contenido. Si algún día se crea en el CMS, lo de allí manda. */
export const legalFallbackEn: LegalContent = {
    ...legalFallback,

    eyebrow: "Legal transparency",
    title: "An organisation legally constituted in Ecuador",
    intro: "Fundación MINKAYNI is a non-governmental, non-profit organisation under private law with a social purpose, granted legal personality by the Ecuadorian State and currently registered in the Unified Information System for Social Organisations (SUIOS).",

    legalForm: "Non-profit foundation (NGO)",
    legalStatus: "Active — tax status ACTIVE (SRI) and “Registered” in the SUIOS",
    ministryResolution:
        "Resolution No. MIES-CZ-8-DDG1-2020-0059-R, of 30 June 2020, issued by the Ministry of Economic and Social Inclusion (MIES)",
    incorporationDate: "30 June 2020",
    suiosCode: "0000130796 — Unified System of Social Organisations (SUIOS), Ministry of Government",
    boardRegistration:
        "Official letter No. MIES-CZ-8-DDGM-2024-1822-OF, of 18 November 2024 (board registered for the period 3 July 2024 – 3 July 2028)",
    legalRepresentative: "Héctor Xavier Moreira Flores, President and legal representative",
    economicActivity: "S94110001 — Activities of non-profit organisations for the development of a given geographical area",

    addressStreet: "Calle 44 ava N.° 817, between Rosendo Avilés and Chambers",
    addressLocality: "Febres Cordero parish, Guayaquil",

    verificationLinks: [
        { text: "Check the RUC with the SRI", href: "https://srienlinea.sri.gob.ec/sri-en-linea/SriRucWeb/ConsultaRuc/Consultas/consultaRuc" },
        { text: "Check the SUIOS registration", href: "https://www.sociedadcivil.gob.ec/" },
    ],

    note: "The original certificates (RUC, SUIOS registration certificate, board registration and statutes) are available for verification, audit and due diligence processes. Request them at info@minkayni.org.",

    pageLink: { text: "Legal transparency", href: "/transparencia" },

    seo: {
        metaTitle: "Legal transparency · Minkayni Foundation",
        metaDescription:
            "Verifiable legal data for Fundación MINKAYNI: RUC 0993333182001, resolution MIES-CZ-8-DDG1-2020-0059-R, SUIOS registration 0000130796, registered address and official contact in Guayaquil, Ecuador.",
    },
};
