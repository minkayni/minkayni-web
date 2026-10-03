import { gsap, ScrollTrigger } from "./main";
import { CARTOON } from "./spring";

/* Fundido de entrada del bloque de Momentos (carrusel + enlace a Novedades).
   El carrusel en sí lo mueve components/index/momentsInit.ts; aquí no se fija
   ni se desplaza nada: la sección no tiene recorrido horizontal propio. */
const init = () => {
    const container = document.querySelector<HTMLElement>("#moments section.my-24");
    if (!container) return;
    const blocks = Array.from(container.children).filter((el): el is HTMLElement => el instanceof HTMLElement && el.tagName !== "SCRIPT");
    if (!blocks.length) return;

    gsap.from(blocks, {
        y: 30,
        opacity: 0,
        stagger: 0.12,
        ...CARTOON,
        scrollTrigger: {
            trigger: container,
            start: "top 85%",
            toggleActions: "play none none reverse",
        },
    });
};

if (!window.__MOMENTS_ANIM__) {
    window.__MOMENTS_ANIM__ = true;
    const start = () => {
        init();
        ScrollTrigger.refresh();
    };
    requestAnimationFrame(() => {
        if (document.readyState === "complete") start();
        else window.addEventListener("load", start, { once: true });
    });
}
