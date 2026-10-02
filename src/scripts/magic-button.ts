/* ──────────────────────────────────────────────────────────────────────────
   El botón «mágico» del sitio: dos etiquetas superpuestas que se
   intercambian palabra a palabra al pasar el ratón, con un brillo animado.

   Vivía dentro de Button.astro. Está aquí porque el mismo botón lo pinta
   también BuilderBlocks.tsx (bloque de llamada a la acción del constructor),
   en build y en la vista previa del panel, y ninguno de esos dos caminos
   incluye el script del componente Astro. Button.astro lo importa de aquí.
─────────────────────────────────────────────────────────────────────────── */
import { gsap, SplitText, waitForFontsReady } from "./main";
import { appleOut } from "./easing";
import { prefersReducedMotion } from "./platform";

export const initMagicButton = (btn: HTMLAnchorElement): void => {
    if (btn.dataset.magicBtnReady) return;
    const glowOuter = btn.querySelector('[data-role="glow-outer"]') as HTMLElement | null;
    const glowInner = btn.querySelector('[data-role="glow-inner"]') as HTMLElement | null;
    const bgFill = btn.querySelector('[data-role="bg-fill"]') as HTMLElement | null;
    const defaultEl = btn.querySelector('[data-role="label-default"]') as HTMLElement | null;
    const hoverEl = btn.querySelector('[data-role="label-hover"]') as HTMLElement | null;
    if (!bgFill || !defaultEl || !hoverEl) return;
    btn.dataset.magicBtnReady = "true";

    const reduced = prefersReducedMotion();

    const setup = () => {
        const splitA = new SplitText(defaultEl, { type: "words", wordClass: "word" });
        const splitB = new SplitText(hoverEl, { type: "words", wordClass: "word" });
        const defaultWords = splitA.words as HTMLElement[];
        const hoverWords = splitB.words as HTMLElement[];
        gsap.set(hoverEl, { opacity: 1 });
        gsap.set(defaultWords, { yPercent: 0, opacity: 1 });
        gsap.set(hoverWords, { yPercent: 110, opacity: 0 });

        const add = (evts: string[], h: (e?: Event) => void) => evts.forEach((e) => btn.addEventListener(e, h));

        if (reduced) {
            const setHover = (h: boolean) => {
                bgFill.style.background = h ? "var(--btn-bg-hover)" : "var(--btn-bg)";
                gsap.set(defaultWords, { yPercent: h ? -100 : 0, opacity: h ? 0 : 1 });
                gsap.set(hoverWords, { yPercent: h ? 0 : 100, opacity: h ? 1 : 0 });
                if (glowOuter) glowOuter.style.opacity = h ? "1" : "0";
                if (glowInner) glowInner.style.opacity = h ? "0.5" : "0";
            };
            add(["pointerenter", "focusin"], () => setHover(true));
            add(["pointerleave", "focusout"], () => setHover(false));
            return;
        }

        const speedVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--glow-speed")) || 5;
        const createLoop = (el: HTMLElement | null) => el && gsap.to(el, { backgroundPosition: "0% 300%", duration: speedVar, ease: "none", repeat: -1, paused: true });
        const outerLoop = createLoop(glowOuter);
        const innerLoop = createLoop(glowInner);

        const hoverTl = gsap
            .timeline({ paused: true, defaults: { duration: 0.6, ease: appleOut } })
            .to(bgFill, { backgroundColor: "var(--btn-bg-hover)", duration: 0.08, ease: "none" }, 0)
            .to(glowOuter, { opacity: 1, duration: 0.35, ease: appleOut }, 0)
            .to(glowInner, { opacity: 0.5, duration: 0.2, ease: "none" }, 0.05)
            .to(defaultWords, { yPercent: -100, opacity: 0, stagger: { each: 0.05, from: "center" }, duration: 0.28 }, 0)
            .to(hoverWords, { yPercent: 0, opacity: 1, stagger: { each: 0.05, from: "center" }, duration: 0.28 }, 0);

        const playAll = () => {
            hoverTl.play();
            outerLoop?.play();
            innerLoop?.play();
        };
        const reverseAll = () => {
            hoverTl.reverse();
            outerLoop?.pause(0);
            innerLoop?.pause(0);
            gsap.set([glowOuter, glowInner], { backgroundPosition: "0% 100%" });
        };
        add(["pointerenter", "focusin"], playAll);
        add(["pointerleave", "focusout"], reverseAll);
    };

    waitForFontsReady(setup);
};

/** Inicializa todos los botones de la página que aún no lo estén. */
export const initMagicButtons = (): void => {
    document.querySelectorAll<HTMLAnchorElement>("a[data-magic-btn]").forEach(initMagicButton);
};
