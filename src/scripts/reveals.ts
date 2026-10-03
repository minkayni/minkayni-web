/* Reveals compartidos de las páginas institucionales (about, impact,
   subpáginas del constructor).

   Correcciones frente a la versión duplicada por página:
   - Los elementos YA visibles al iniciar no se ocultan (antes se les hacía
     set(opacity:0) y el trigger disparaba en el mismo frame → parpadeo).
   - ScrollTrigger.refresh() al terminar de cargar la página y las imágenes
     (las posiciones se calculaban con el layout a medio cargar → saltos). */
import { gsap, ScrollTrigger } from "./main";
import { CARTOON } from "./spring";
import { prefersReducedMotion } from "./platform";

const isInView = (el: HTMLElement): boolean => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
};

/* Estado oculto de partida. Las tarjetas llevan `transition` de Tailwind para
   su hover, y esa transición también cubre opacity y transform: CSS volvía a
   interpolar cada cuadro que escribía GSAP con 300 ms de retraso, así que la
   entrada iba por detrás —lenta— y se ponía al día de golpe al final. Durante
   la entrada no hay transición CSS; al terminar se devuelve para el hover. */
const hide = (targets: HTMLElement[]) => gsap.set(targets, { opacity: 0, y: 44, transition: "none" });
const restoreCss = { clearProps: "transition,transform" } as const;

export const initReveals = (): void => {
    const reduced = prefersReducedMotion();
    if (reduced) return;

    /* Los títulos con ScrollFloat (`h2[data-scroll-float]`) ya tienen su
       propia entrada, letra a letra y ligada al scroll. Si además el bloque que
       los contiene hace fade-in-up, las dos animaciones se pisan y la del
       título no se aprecia. Así que un bloque revelable que contenga un título
       flotante anima a sus hijos MENOS ese título: el eyebrow y el párrafo
       siguen entrando como antes, y el título queda solo para ScrollFloat. */
    const FLOAT = "[data-scroll-float]";
    const revealTargets = (el: HTMLElement): HTMLElement[] => {
        if (el.matches(FLOAT)) return [];
        if (!el.querySelector(FLOAT)) return [el];
        return (Array.from(el.children) as HTMLElement[]).filter((child) => !child.matches(FLOAT) && !child.querySelector(FLOAT));
    };

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (el.dataset.revealReady) return;
        el.dataset.revealReady = "1";
        if (isInView(el)) return; // ya visible: no ocultar ni animar (evita el flash)
        const targets = revealTargets(el);
        if (!targets.length) return;
        hide(targets);
        ScrollTrigger.create({
            trigger: el,
            start: "top 88%",
            once: true,
            onEnter: () =>
                gsap.to(targets, {
                    opacity: 1,
                    y: 0,
                    ...CARTOON,
                    delay: parseFloat(el.dataset.revealDelay || "0"),
                    onComplete: () => gsap.set(targets, restoreCss),
                }),
        });
    });

    document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
        if (group.dataset.revealReady) return;
        group.dataset.revealReady = "1";
        if (isInView(group)) return;
        const kids = (Array.from(group.children) as HTMLElement[]).filter((kid) => !kid.matches(FLOAT) && !kid.querySelector(FLOAT));
        if (!kids.length) return;
        hide(kids);
        ScrollTrigger.create({
            trigger: group,
            start: "top 85%",
            once: true,
            onEnter: () =>
                gsap.to(kids, {
                    opacity: 1,
                    y: 0,
                    ...CARTOON,
                    stagger: 0.12,
                    onComplete: () => gsap.set(kids, restoreCss),
                }),
        });
    });

    document.querySelectorAll<HTMLElement>("[data-float]").forEach((el, i) => {
        if (el.dataset.floatReady) return;
        el.dataset.floatReady = "1";
        gsap.to(el, { y: -12, rotation: "+=4", duration: 2.8 + (i % 3) * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });

    /* Los saltos bruscos vienen de posiciones calculadas antes de que carguen
       imágenes y fuentes: recalcular al cerrar el ciclo de carga. */
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    document.querySelectorAll<HTMLImageElement>("main img, #smooth-content img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    });
};
