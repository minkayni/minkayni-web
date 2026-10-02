/* Fallback local del single type `donate-page` (página /donate).

   La cuenta institucional es una sola ficha y concentra TODO: los datos que
   pide una transferencia nacional y los que pide un giro desde el exterior
   (dirección del titular, dirección del banco, SWIFT y moneda). No se
   repiten en otro bloque: un dato bancario duplicado es un dato que algún
   día queda desactualizado en uno de los dos sitios.

   Los números están tomados del certificado del Banco del Pacífico
   (21 feb 2024) y del certificado de RUC del SRI; la dirección del banco es
   la registrada en el directorio SWIFT para PACIECEG.

   `paymentMethods` está vacío a propósito: se llena desde Strapi el día que
   exista una pasarela contratada. Un canal sin `href` no se pinta, así que
   la página nunca muestra un botón muerto.

   Nota editorial: la personería jurídica y el RUC se mencionan UNA vez
   —donde hacen falta para transferir— y el detalle legal vive en
   /transparencia. Repetirlos en cada bloque vuelve la página ilegible.

   ⚠️ Cualquier cambio de cuenta se edita en Strapi (Contenido → Página ·
   Aporta) y se verifica contra el certificado del banco antes de publicar:
   un dígito equivocado devuelve la transferencia al donante. */

import type { DonationMethod, FaqItem } from "../../schemas/pages.zod";

export const donateFallback = {
    intro: {
        eyebrow: "Aporta hoy",
        title: "Tu aporte suena\nen *todo el barrio*.",
        body: "Cada donación sostiene ensayos, instrumentos y procesos formativos para las juventudes de Guayaquil. Somos una fundación sin fines de lucro: tu aporte llega directo a la cuenta institucional y se respalda con un certificado de donación.",
    },

    /* Único atajo, en inglés: es la pista que un donante extranjero necesita
       para encontrar sus datos dentro de la ficha de la cuenta. */
    channelLinks: [{ text: "Donating from abroad", href: "#desde-el-exterior" }],

    accountsHeading: {
        eyebrow: "Cuenta institucional",
        title: "Transferencia directa,\n*sin intermediarios*.",
        body: "Es la vía que más rinde: el dinero entra completo, sin comisiones de plataforma. Sirve igual desde Ecuador y desde cualquier país. Después de transferir, envíanos el comprobante y te devolvemos el certificado de donación.",
    },

    accounts: [
        {
            bank: "Banco del Pacífico S.A.",
            accountType: "Cuenta Corriente",
            accountNumber: "8335982",
            holder: "FUNDACIÓN MINKAYNI",
            taxId: "0993333182001",
            swift: "PACIECEG",
            holderAddress: "Calle 44 ava N.° 817, entre Rosendo Avilés y Chambers, Parroquia Febres Cordero, Guayaquil, Guayas, Ecuador",
            bankAddress: "P. Icaza 200 y Pichincha, Guayaquil, Ecuador",
            currency: "USD · dólar estadounidense",
            wireNote: "Si tu banco pide un banco intermediario o corresponsal, consúltalo con ellos: cada entidad usa el suyo para llegar a Ecuador y puede descontar una comisión del giro.",
            note: "Cuenta institucional activa desde el 21 de febrero de 2024.",
        },
    ],

    /* Sub-bloque dentro de la ficha, no una sección aparte. */
    internationalHeading: {
        eyebrow: "Desde el exterior",
        title: "Datos para el giro internacional",
        body: "Ecuador usa el dólar estadounidense: una donación en USD llega sin conversión de moneda. Copia estos datos tal cual, junto con los de arriba — un giro se devuelve si falta el SWIFT o si el beneficiario no coincide con el titular.",
    },

    transferNote: "Desde cualquier banco o cooperativa del país puedes transferir con el número de cuenta y el nombre del titular. Si tu banco pide el tipo de identificación del beneficiario, elige RUC.",

    paymentMethodsHeading: {
        eyebrow: "Pago en línea",
        title: "Donar con tarjeta",
        body: "Pagas en el sitio de la pasarela y el dinero se acredita en la cuenta de la fundación. Ideal si prefieres no hacer una transferencia manual.",
    },

    paymentMethods: [] as DonationMethod[],

    transferAppsHeading: {
        eyebrow: "Desde el exterior",
        title: "Apps de envío\n*más baratas que un giro*.",
        body: "Un giro bancario tradicional puede costar decenas de dólares en comisiones entre bancos. Estas aplicaciones depositan directo en la cuenta de la fundación por una fracción de eso, y suelen llegar el mismo día. Usa los datos de la cuenta institucional como destino.",
    },

    transferApps: [
        { name: "Wise", description: "Envía a cuentas bancarias de Ecuador en dólares, con comisión baja y sin conversión de moneda. Llega en horas.", href: "https://wise.com/", linkText: "Enviar con Wise", fee: "Comisión baja", icon: "mdi:bank-transfer-out" },
        { name: "Remitly", description: "Disponible desde Estados Unidos, España y varios países más, con depósito directo a bancos ecuatorianos.", href: "https://www.remitly.com/", linkText: "Enviar con Remitly", fee: "Depósito directo", icon: "mdi:cellphone-arrow-down" },
    ] as DonationMethod[],

    /* La clave se llama `english` por historia —era un aviso en inglés para
       donantes extranjeros cuando el sitio solo existía en español— y así la
       conserva el tipo `donatePage` del CMS. Ahora va en el idioma de la
       página: esta es la versión española; la inglesa, en donateFallbackEn. */
    english: {
        title: "Donar desde fuera de Ecuador",
        body: "La Fundación MINKAYNI es una organización sin fines de lucro con sede en Guayaquil, Ecuador. La moneda oficial del país es el dólar estadounidense, así que una donación en USD nos llega sin conversión de moneda.",
        note: "Usa los datos de cuenta de esta página —la sección del giro reúne todo lo que te pedirá tu banco— o envía el dinero con Wise o Remitly, que suelen costar mucho menos que un giro bancario. Manda el comprobante a info@minkayni.org y te enviamos nuestro certificado de donación. Una donación directa a una organización extranjera normalmente no es deducible de impuestos en tu país; si tu organización necesita un recibo deducible, escríbenos y buscamos juntos una vía.",
    },

    faqHeading: {
        eyebrow: "Antes de donar",
        title: "Lo que suelen\npreguntarnos.",
        body: "",
    },

    faq: [
        {
            question: "¿Mi donación llega completa?",
            answer: "Desde Ecuador, sí: la transferencia entra íntegra a la cuenta institucional. Desde el exterior, el banco emisor o un banco intermediario pueden descontar una comisión del giro; por eso recomendamos las apps de envío de dinero, que cobran mucho menos.",
        },
        {
            question: "¿Recibo un comprobante de la fundación?",
            answer: "Sí. Envía el comprobante de tu transferencia a info@minkayni.org o por WhatsApp y te devolvemos el certificado de donación de la fundación.",
        },
        {
            question: "¿Puedo donar todos los meses?",
            answer: "Sí. Puedes programar una transferencia recurrente desde tu banco o tu app con el mismo número de cuenta. Escríbenos y te contamos qué proceso sostiene tu aporte mes a mes.",
        },
        {
            question: "¿La donación es deducible de impuestos?",
            answer: "Emitimos un certificado de donación por cada aporte. Cómo se aplica ese certificado depende del régimen tributario de cada país o persona: consúltalo con tu contador antes de donar.",
        },
    ] as FaqItem[],

    impactHeading: {
        eyebrow: "A dónde va tu aporte",
        title: "Nada se queda\nen el escritorio.",
        body: "",
    },

    impactCards: [
        { title: "Instrumentos y mantenimiento", description: "Tambores, parches, baquetas y arreglos: el material que hace posible cada ensayo en los sectores donde trabajamos." },
        { title: "Procesos formativos", description: "Talleres de liderazgo, derechos humanos, prevención de violencias y comunicación popular con jóvenes y sus familias." },
        { title: "Logística de los territorios", description: "Transporte, refrigerios y espacios seguros para que ningún joven deje de participar por no tener cómo llegar." },
    ],

    otherWaysHeading: {
        eyebrow: "Otras formas de sumarte",
        title: "No todo\n*se dona en dinero*.",
        body: "",
    },

    otherWays: [
        { title: "Donación en especie", description: "Instrumentos, equipos de sonido, material didáctico o insumos para los talleres." },
        { title: "Voluntariado", description: "Facilitación, comunicación, diseño, gestión de proyectos o acompañamiento técnico." },
        { title: "Alianzas institucionales", description: "Cooperación, financiamiento de programas y proyectos conjuntos con organizaciones y empresas." },
    ],

    contactButton: { href: "mailto:info@minkayni.org", defaultText: "Enviar comprobante 💜", hoverText: "info@minkayni.org ✨" },
    whatsappLink: { text: "Escríbenos por WhatsApp", href: "https://wa.me/593985261647" },

    legalNote: "Somos una organización sin fines de lucro con personería jurídica en Ecuador y rendimos cuentas de cada aporte.",

    seo: {
        metaTitle: "Aporta hoy · Fundación Minkayni",
        metaDescription: "Dona a Fundación MINKAYNI desde Ecuador o desde el exterior: cuenta institucional del Banco del Pacífico con datos SWIFT completos, apps de envío y otras formas de sumarte al proyecto en Guayaquil.",
    },
};

export type DonateContent = typeof donateFallback;

/* Versión en inglés.

   Los datos bancarios se repiten IGUALES y a propósito: número de cuenta,
   SWIFT, titular y RUC son literales del certificado del banco. Un donante
   los copia tal cual en el formulario de su banco, así que traducir cualquiera
   de ellos —incluido el nombre del titular— haría que la transferencia se
   devolviera. Solo se traduce lo que se lee, no lo que se copia.

   Igual que la página legal, hoy este fallback ES el contenido en inglés: el
   single type `donate-page` del CMS desplegado todavía no tiene los campos
   nuevos, así que la consulta falla y la página se sirve desde aquí. */
export const donateFallbackEn: DonateContent = {
    ...donateFallback,

    intro: {
        eyebrow: "Give today",
        title: "Your gift sounds\nacross *the whole neighbourhood*.",
        body: "Every donation sustains rehearsals, instruments and training for young people in Guayaquil. We are a non-profit foundation: your gift goes straight into the institutional account and is backed by a donation certificate.",
    },

    channelLinks: [{ text: "Donating from abroad", href: "#desde-el-exterior" }],

    accountsHeading: {
        eyebrow: "Institutional account",
        title: "A direct transfer,\n*with no middlemen*.",
        body: "This is the way that goes furthest: the money arrives in full, with no platform fees. It works the same from Ecuador and from any other country. Once you have transferred, send us the receipt and we will send back your donation certificate.",
    },

    accounts: [
        {
            ...donateFallback.accounts[0],
            accountType: "Current account",
            currency: "USD · United States dollar",
            holderAddress: "Calle 44 ava N.° 817, between Rosendo Avilés and Chambers, Febres Cordero parish, Guayaquil, Guayas, Ecuador",
            bankAddress: "P. Icaza 200 y Pichincha, Guayaquil, Ecuador",
            wireNote: "If your bank asks for an intermediary or correspondent bank, check with them: each institution uses its own to reach Ecuador, and it may deduct a fee from the transfer.",
            note: "Institutional account, active since 21 February 2024.",
        },
    ],

    internationalHeading: {
        eyebrow: "From abroad",
        title: "Details for an international wire",
        body: "Ecuador uses the US dollar, so a donation in USD arrives with no currency conversion. Copy these details exactly, together with the ones above — a wire is returned if the SWIFT code is missing or the beneficiary does not match the account holder.",
    },

    transferNote: "From any bank or credit union in the country you can transfer using the account number and the account holder's name. If your bank asks for the beneficiary's type of identification, choose RUC.",

    paymentMethodsHeading: {
        eyebrow: "Online payment",
        title: "Donate by card",
        body: "You pay on the provider's site and the money is credited to the foundation's account. Ideal if you would rather not make a manual transfer.",
    },

    transferAppsHeading: {
        eyebrow: "From abroad",
        title: "Transfer apps,\n*cheaper than a bank wire*.",
        body: "A traditional bank wire can cost tens of dollars in fees between banks. These apps deposit straight into the foundation's account for a fraction of that, and usually arrive the same day. Use the institutional account details as the destination.",
    },

    transferApps: [
        { name: "Wise", description: "Sends to Ecuadorian bank accounts in dollars, with a low fee and no currency conversion. Arrives within hours.", href: "https://wise.com/", linkText: "Send with Wise", fee: "Low fee", icon: "mdi:bank-transfer-out" },
        { name: "Remitly", description: "Available from the United States, Spain and several other countries, with direct deposit to Ecuadorian banks.", href: "https://www.remitly.com/", linkText: "Send with Remitly", fee: "Direct deposit", icon: "mdi:cellphone-arrow-down" },
    ] as DonationMethod[],

    english: {
        title: "Donating from outside Ecuador",
        body: "Fundación MINKAYNI is a non-profit based in Guayaquil, Ecuador. The country's official currency is the US dollar, so a gift in USD reaches us with no currency conversion.",
        note: "Use the account details on this page — the wire section lists everything your bank will ask for — or send the funds through Wise or Remitly, usually far cheaper than a bank wire. Email the receipt to info@minkayni.org and we will send you our donation certificate. A direct gift to a foreign charity is normally not tax-deductible in your own country; if your organisation needs a deductible receipt, write to us and we will look for a route together.",
    },

    faqHeading: {
        eyebrow: "Before you give",
        title: "What people\nusually ask us.",
        body: "",
    },

    faq: [
        {
            question: "Does my donation arrive in full?",
            answer: "From Ecuador, yes: the transfer reaches the institutional account intact. From abroad, the sending bank or an intermediary bank may deduct a fee from the wire; that is why we recommend the money transfer apps, which charge far less.",
        },
        {
            question: "Do I get a receipt from the foundation?",
            answer: "Yes. Send the proof of your transfer to info@minkayni.org or by WhatsApp and we will send back the foundation's donation certificate.",
        },
        {
            question: "Can I give every month?",
            answer: "Yes. You can set up a recurring transfer from your bank or your app using the same account number. Write to us and we will tell you which process your gift sustains month by month.",
        },
        {
            question: "Is the donation tax-deductible?",
            answer: "We issue a donation certificate for every gift. How that certificate applies depends on the tax rules of each country and person: check with your accountant before giving.",
        },
    ] as FaqItem[],

    impactHeading: {
        eyebrow: "Where your gift goes",
        title: "Nothing stays\nat a desk.",
        body: "",
    },

    impactCards: [
        { title: "Instruments and maintenance", description: "Drums, drumheads, sticks and repairs: the kit that makes every rehearsal possible in the sectors where we work." },
        { title: "Training processes", description: "Workshops on leadership, human rights, violence prevention and grassroots communication with young people and their families." },
        { title: "Logistics on the ground", description: "Transport, refreshments and safe spaces so that no young person drops out for lack of a way to get there." },
    ],

    otherWaysHeading: {
        eyebrow: "Other ways to join in",
        title: "Not everything\n*is given in money*.",
        body: "",
    },

    otherWays: [
        { title: "Gifts in kind", description: "Instruments, sound equipment, teaching materials or supplies for the workshops." },
        { title: "Volunteering", description: "Facilitation, communications, design, project management or technical support." },
        { title: "Institutional partnerships", description: "Cooperation, programme funding and joint projects with organisations and companies." },
    ],

    contactButton: { href: "mailto:info@minkayni.org", defaultText: "Send your receipt 💜", hoverText: "info@minkayni.org ✨" },
    whatsappLink: { text: "Message us on WhatsApp", href: "https://wa.me/593985261647" },

    legalNote: "We are a non-profit organisation with legal personality in Ecuador and we account for every gift.",

    seo: {
        metaTitle: "Give today · Minkayni Foundation",
        metaDescription:
            "Donate to Fundación MINKAYNI from Ecuador or from abroad: Banco del Pacífico institutional account with full SWIFT details, transfer apps and other ways to join the project in Guayaquil.",
    },
};
