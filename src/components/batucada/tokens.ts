/* Sistema Batucada Popular como clases Tailwind compartidas.
   Este archivo es la única fuente del sistema (sustituye a batucada.css):
   Tailwind v4 escanea también los .ts, así que las clases definidas aquí
   se generan aunque solo se usen vía import.

   IMPORTANTE: todas las clases son literales estáticos — el escáner de
   Tailwind lee texto crudo y NO ve interpolaciones (`py-[${x}]` nunca
   se generaría).

   Paleta (tokens del @theme): bp-blue #29aae1 dominante · primary morado
   soporte · accent amarillo puntual · black/white = tinta/crema del sitio.
   Pares WCAG verificados: tinta/azul 7.57 · tinta/crema 18.67 ·
   crema/morado 8.93 · tinta/amarillo 9.53 · amarillo/morado 4.55.
   Breakpoints por contenido: sm=40rem (pares de párrafos ~30ch/col),
   md=48rem (el arco del footer pasa de 150 a 300px), lg=64rem (copy+foto).

   Ritmo espacial: compás clamp(4rem,9vw,8rem) · medio clamp(2.25rem,5vw,4.5rem)
   · cuarto clamp(2rem,4.5vw,3.5rem) · corchea clamp(1rem,2.5vw,2rem). */

export const bp = {
    /* margen de página como padding del propio bloque */
    edge: "px-[max(1.25rem,calc((100vw-1480px)/2))]",
    block: "px-[max(1.25rem,calc((100vw-1480px)/2))] py-[clamp(4rem,9vw,8rem)]",
    /* la última sección deja sitio al arco del footer (DomeSeparator absoluto:
       invade 150px en móvil y 300px desde md) */
    predome: "pb-[calc(clamp(4rem,9vw,8rem)+170px)] md:pb-[calc(clamp(4rem,9vw,8rem)+330px)]",

    /* tipografía */
    eyebrow: "text-[0.78rem] font-black uppercase tracking-[0.16em]",
    h1: "bp-h1 font-bp uppercase tracking-[-0.03em] text-[clamp(2.25rem,min(5.2vw,9.2cqi),5.4rem)] leading-[1] sm:leading-[0.94] text-balance",
    h2: "font-bp uppercase tracking-[-0.03em] text-[clamp(2.1rem,4.1vw,4.5rem)] leading-[1] sm:leading-[0.96] mt-4 max-w-[20ch] sm:max-w-[16ch] text-balance",
    h3: "font-bp uppercase text-[clamp(1.3rem,1.5vw,1.7rem)]",
    mega: "font-bp uppercase tracking-[-0.04em] text-[clamp(3.2rem,9.5vw,9.5rem)] leading-[0.88] text-balance",
    body: "text-[clamp(1.05rem,1rem+0.4vw,1.28rem)] leading-[1.65] text-pretty",
    riso: "[text-shadow:0.045em_0.045em_0_rgba(10,8,1,0.16)]",

    /* campos de color con overlays grunge (capas de background del propio
       elemento: se componen una vez, sin costo por frame) */
    fieldBlue:
        "bg-bp-blue text-black [background-image:url(/batucada/semitono-soft.webp),var(--bp-noise)] [background-size:cover,auto] [background-blend-mode:multiply,soft-light]",
    fieldInk:
        "bg-black text-white [background-image:url(/batucada/grunge-inv-soft.webp),var(--bp-noise)] [background-size:cover,auto] [background-position:right_center,left_top] [background-blend-mode:screen,soft-light]",
    fieldPurple:
        "bg-primary text-white [background-image:url(/batucada/grunge-soft.webp),var(--bp-noise)] [background-size:cover,auto] [background-position:right_center,left_top] [background-blend-mode:multiply,soft-light]",

    /* botón sello: golpea y deja su eco como sombra dura */
    button: "min-h-12 inline-flex items-center justify-center px-6 py-[0.9rem] border-[3px] border-black rounded-[3px_7px_4px_6px] font-black uppercase tracking-[0.04em] spring hover:-translate-x-[3px] hover:-translate-y-[3px] hover:-rotate-[0.5deg] focus-visible:outline-[3px] focus-visible:outline-offset-4 motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:hover:rotate-0 motion-reduce:hover:shadow-none motion-reduce:hover:underline",
    buttonYellow: "bg-accent text-black hover:shadow-[5px_5px_0_var(--bg-black)]",
    buttonInk: "bg-black text-white hover:shadow-[5px_5px_0_var(--bg-white)]",

    textLink:
        "group min-h-11 inline-flex items-center gap-[0.6rem] border-b-2 border-current text-current font-black focus-visible:outline-[3px] focus-visible:outline-offset-4",
    textLinkArrow:
        "text-[1.35em] spring group-hover:translate-x-[0.2rem] group-hover:translate-y-[0.2rem] motion-reduce:transition-none",

    /* marco de foto y su eco (la placa desplazada vive como span real) */
    visual: "relative mr-[clamp(0.75rem,1.5vw,1.25rem)] mb-[clamp(0.75rem,1.5vw,1.25rem)]",
    echoPlate:
        "absolute inset-0 translate-x-[clamp(0.75rem,1.5vw,1.25rem)] translate-y-[clamp(0.75rem,1.5vw,1.25rem)] border-[3px] border-black",
    frame: "relative border-[3px] border-black bg-black overflow-hidden",
    frameImg: "block w-full h-full object-cover [filter:saturate(0.92)_contrast(1.06)]",

    /* cinta adhesiva (dos tiras reales, aria-hidden) */
    tape: "pointer-events-none absolute z-[2] w-[clamp(3.5rem,6vw,5.5rem)] h-[1.35rem] bg-white/80 border-x border-dashed border-black/25 shadow-[0_1px_2px_rgba(10,8,1,0.12)]",
    tapeTL: "-top-[0.6rem] -left-[1.1rem] -rotate-[38deg]",
    tapeBR: "-bottom-[0.55rem] -right-[1.1rem] -rotate-[36deg]",

    /* sello de caucho desgastado por máscara de ruido */
    stamp: "inline-block px-[0.9rem] py-2 border-[3px] border-current shadow-[inset_0_0_0_1px_currentColor] -rotate-[2.5deg] font-black uppercase tracking-[0.14em] [mask-image:var(--bp-noise),linear-gradient(#000,#000)]",

    /* nota de papel pegada con cinta */
    note: "relative p-[clamp(1.5rem,3vw,2.25rem)] border-[3px] border-black bg-white text-black shadow-[6px_6px_0_rgba(10,8,1,0.16)] rotate-[0.8deg]",
};
