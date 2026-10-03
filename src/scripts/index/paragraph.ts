import { gsap, ScrollTrigger, SplitText, waitForFontsReady } from "../main.ts";
import { CARTOON } from "../spring";

/* La leyenda de la portada viene visible en el HTML y se pinta con el primer
   cuadro: en móvil es el elemento más grande de la primera pantalla —el LCP
   que mide PageSpeed— y esconderla hasta que cargaran el script, las fuentes
   y un segundo de espera costaba seis segundos de LCP.

   La cascada palabra a palabra solo tiene sentido cuando el texto todavía no
   está a la vista: al salir de la intro (que tapa la página) o si la leyenda
   entra por scroll. Si ya está en pantalla se deja tal cual y solo arrancan
   los contadores. */
type Opciones = {
    /** La intro acaba de terminar: el texto estaba tapado y puede entrar en cascada. */
    fromIntro?: boolean;
};

/* El contador (`[data-count]`) lo monta scripts/count-up.ts: SplitText no debe entrar en
   él, o partiría sus dígitos en palabras. Pero sí entra en la cascada, en su
   posición dentro del texto, y al llegarle el turno se avisa a CounterMount
   para que arranque a contar justo entonces. La marca queda en el DOM por si
   CounterMount hidrata después. */
const revealCounter = (el: HTMLElement): void => {
    el.dataset.countRevealed = "1";
    window.dispatchEvent(new CustomEvent("count:reveal", { detail: { el } }));
};

export const animateParagraph = (prefersReduced: boolean, opts: Opciones = {}): void => {
    const p = document.getElementById("foundation-text") as (HTMLElement & { _animated?: boolean }) | null;
    if (!p || p._animated) return;
    p._animated = true;

    const counters = Array.from(p.querySelectorAll<HTMLElement>("[data-count]"));
    const rect = p.getBoundingClientRect();
    const aLaVista = rect.top < window.innerHeight && rect.bottom > 0;

    if (prefersReduced || (aLaVista && !opts.fromIntro)) {
        counters.forEach(revealCounter);
        return;
    }

    /* Se esconde ahora, no en el HTML: hasta aquí el texto estaba pintado (o
       tapado por la intro) y nadie lo echa en falta mientras se parte. */
    p.style.visibility = "hidden";

    waitForFontsReady(() => {
        /* `aria: "none"`: por defecto SplitText pone `aria-hidden` en cada
           palabra y un `aria-label` en el párrafo, y los enlaces de la leyenda
           («Fundación Minkayni», «Batucada Popular») se quedaban sin texto
           accesible (PageSpeed: «Links do not have a discernible name»). */
        const split = new SplitText(p, { type: "words", ignore: "[data-count]", aria: "none" });
        const words: HTMLElement[] = split.words as HTMLElement[];
        const sequence = [...words, ...counters].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        const ST = 0.03;

        gsap.set(sequence, { opacity: 0, y: 12 });
        p.style.visibility = "visible";

        const tl = gsap.timeline({ paused: true, delay: opts.fromIntro ? 1 : 0 });
        sequence.forEach((el, i) => {
            const isCounter = counters.includes(el);
            tl.to(el, { opacity: 1, y: 0, ...CARTOON, onStart: isCounter ? () => revealCounter(el) : undefined }, i * ST);
        });

        if (opts.fromIntro) {
            tl.play();
            return;
        }
        ScrollTrigger.create({ trigger: p, start: "top 85%", once: true, onEnter: () => tl.play() });
    });
};
