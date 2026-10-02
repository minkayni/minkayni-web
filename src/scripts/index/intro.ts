import { gsap, ScrollTrigger, waitForFontsReady } from "../main.ts";
import { appleOut } from "../easing";
import { $, on, setHeights, setRadius } from "./helpers";
import { animateParagraph } from "./paragraph";
import type { AnimationItem } from "lottie-web";
import { prefersReducedMotion } from "../platform";

const NAV_STROKE_MULTIPLIER = 1.2;

/* -------------------------- Helpers de módulo -------------------------- */

const showPageNav = (): void => {
    const pageNav = document.querySelector(".page-nav") as HTMLElement | null;
    if (!pageNav) return;
    pageNav.style.removeProperty("display");
    pageNav.style.visibility = "visible";
    pageNav.style.opacity = "1";
    pageNav.style.pointerEvents = "auto";
    pageNav.style.transform = "translateY(0)";
    const ul = pageNav.querySelector("ul") as HTMLElement | null;
    if (ul) ul.style.pointerEvents = "auto";
    pageNav.setAttribute("data-nav-hidden", "false");
    const toggleBtn = pageNav.querySelector(".page-nav-toggle") as HTMLElement | null;
    if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", "true");
        toggleBtn.setAttribute("data-nav-hidden", "false");
    }
    const links = pageNav.querySelectorAll<HTMLAnchorElement>(".nav-link");
    links.forEach((a) => (a.style.pointerEvents = "auto"));
};

const prepareNavStrokes = (navTexts: NodeListOf<Element>): void => {
    navTexts.forEach((t) => {
        const svgText = t as SVGTextElement;
        const len = svgText.getComputedTextLength() * NAV_STROKE_MULTIPLIER;
        svgText.setAttribute("stroke-dasharray", String(len));
        svgText.setAttribute("stroke-dashoffset", String(len));
        svgText.style.setProperty("fill-opacity", "0");
    });
};

const animateNavAndParagraph = (
    prefersReduced: boolean,
    navTexts: NodeListOf<Element>,
    fromIntro = false
): void => {
    /* El nav lateral y sus trazos arrancan al segundo, no a los tres: cada
       segundo con la pantalla a medio pintar lo cuenta el Speed Index. */
    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    tl.add(() => showPageNav(), 1)
        .to(
            navTexts,
            {
                strokeDashoffset: 0,
                duration: 5,
                ease: appleOut,
                stagger: 0.05,
            },
            1
        )
        /* La leyenda decide sola si entra en cascada (ver paragraph.ts); al
           salir de la intro se le avisa para que sí lo haga. Va en 0 para que
           la esconda antes del primer cuadro de la revelación circular. */
        .call(animateParagraph, [prefersReduced, { fromIntro }], 0);
};

/** `html[data-intro="pending"]` lo pone head.astro antes del primer pintado
    y es lo que mantiene tapado #app-content (ver index.astro). Se retira en
    cuanto el contenido debe verse, por el camino que sea. */
const introResuelta = (): void => {
    document.documentElement.removeAttribute("data-intro");
};

/* ------------------------- API pública añadida ------------------------- */
/**
 * Muestra el contenido como si la intro hubiese sido omitida (o nunca existido),
 * configurando alturas, radios, nav y disparando las animaciones iniciales.
 *
 * @param opts.prefersReduced Fuerza modo reducido. Por defecto respeta media query.
 * @param opts.height Altura final de la cabecera/hero (por defecto "70svh").
 * @param opts.radius Radio de borde final del contenedor (por defecto "30px").
 * @param opts.emitEvent Si debe emitir el evento "intro:finished" (true por defecto).
 */
/** Altura final del hero. La define `--hero-h` en index.astro, para que el
    texto de la leyenda pueda calcular su desplazamiento a partir del mismo
    valor en lugar de repetirlo. */
const heroHeight = (): string =>
    getComputedStyle(document.documentElement).getPropertyValue("--hero-h").trim() || "70svh";

export const showContentNoIntro = (opts?: {
    prefersReduced?: boolean;
    height?: string;
    radius?: string | null;
    emitEvent?: boolean;
    cascade?: boolean;        // <-- nuevo
    cascadeDelay?: number;    // <-- nuevo
}): void => {
    const hasIntroShell = Boolean(
        document.getElementById("app-content") ||
        document.getElementById("intro-overlay") ||
        document.querySelector(".bg__container, .bg__container__logo")
    );

    const prefersReduced =
        opts?.prefersReduced ??
        (prefersReducedMotion());

    const targetHeight = opts?.height ?? heroHeight();
    const targetRadius = opts?.radius ?? "30px";
    const emitEvent = opts?.emitEvent ?? true;
    /* Sin cascada salvo que se pida: el navbar ya viene pintado en el HTML
       (ver Navbar.astro) y esconderlo para hacerlo entrar sería un parpadeo. */
    const doCascade = opts?.cascade ?? false;
    const cascadeDelay = opts?.cascadeDelay ?? 0.6;

    /* Esenciales de TODA página (el navbar y el scroll viven fuera del
       shell de la intro): deben correr aunque no exista #app-content. */
    document.body.removeAttribute("data-intro");
    const navContainer = $("#nav-container") as HTMLElement | null;
    if (navContainer) navContainer.style.display = "block";

    if (!hasIntroShell) {
        /* Página interior: sin overlay ni animaciones del homepage.
           Solo desbloquear scroll y revelar el navbar (con su cascada). */
        document.documentElement.classList.remove("no-scroll");
        document.body.classList.remove("no-scroll");
        (document.documentElement as HTMLElement).style.removeProperty("overflow-y");
        document.body.style.removeProperty("overflow-y");

        const navItems = document.querySelectorAll("#navBase .animate, #navBase .animate > *");
        waitForFontsReady(() => {
            if (document.querySelector("#navBase > *")) {
                gsap.set("#navBase > *", { opacity: 1, y: 0 });
            }
            if (!prefersReduced && doCascade && navItems.length) {
                gsap.set(navItems, { y: 40, opacity: 0 });
                gsap.to(navItems, {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: appleOut,
                    stagger: 0.08,
                    /* NavMenu (React) entra con esta misma cascada, no al acabar la intro. */
                    onStart: () => window.dispatchEvent(new CustomEvent("nav:reveal")),
                    delay: cascadeDelay,
                });
            }
            if (emitEvent) {
                requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("intro:finished")));
            }
            requestAnimationFrame(() => ScrollTrigger?.refresh());
        });
        return;
    }

    const overlay = $("#intro-overlay") as HTMLElement | null;
    const content = $("#app-content") as HTMLElement | null;
    const navTexts = document.querySelectorAll(".page-nav .nav-text");
    const navItems = document.querySelectorAll("#navBase .animate, #navBase .animate > *");

    // Mostrar contenido base
    overlay?.remove();
    introResuelta();
    content?.classList.replace("opacity-0", "opacity-100");
    setHeights(targetHeight);
    setRadius(targetRadius);

    // Limpiar bloqueo de scroll
    document.documentElement.classList.remove("no-scroll");
    document.body.classList.remove("no-scroll");
    (document.documentElement as HTMLElement).style.removeProperty("overflow-y");
    document.body.style.removeProperty("overflow-y");

    waitForFontsReady(() => {
        // Preparar strokes
        prepareNavStrokes(navTexts);
        content?.style.removeProperty("clip-path");

        // Asegurar visibilidad base del nav
        gsap.set("#navBase > *", { opacity: 1, y: 0 });
        showPageNav(); // <-- visible desde ya para que la cascada se vea

        // Estado inicial para la cascada (igual que en la intro real)
        if (doCascade && navItems.length) {
            gsap.set(navItems, { y: 40, opacity: 0 });
        }

        // Timeline sin intro: cascada + (párrafo y strokes con sus offsets internos)
        const tl = gsap.timeline({ defaults: { overwrite: "auto" } });

        if (doCascade && navItems.length) {
            tl.to(
                navItems,
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: appleOut,
                    stagger: 0.08,
                    /* NavMenu (React) entra con esta misma cascada, no al acabar la intro. */
                    onStart: () => window.dispatchEvent(new CustomEvent("nav:reveal")),
                },
                cascadeDelay // ≈ 0.6s
            );
        }

        // Mantiene tiempos internos de animateNavAndParagraph (nav lateral y trazos al segundo)
        tl.call(animateNavAndParagraph, [prefersReduced, navTexts], 0);

        // Notificar y refrescar
        if (emitEvent) {
            requestAnimationFrame(() =>
                window.dispatchEvent(new CustomEvent("intro:finished"))
            );
        }
        requestAnimationFrame(() => ScrollTrigger?.refresh());
    });
};


/* ---------------------------- Intro original --------------------------- */

export const initIntro = (prefersReduced: boolean): void => {
    document.body.dataset.intro = "pending";

    const navContainer = $("#nav-container") as HTMLElement | null;
    if (navContainer) navContainer.style.display = "block";

    const navTexts = document.querySelectorAll(".page-nav .nav-text");
    const overlay = $("#intro-overlay") as HTMLElement | null;
    const stage = $("#intro-lottie") as HTMLElement | null;
    const content = $("#app-content") as HTMLElement | null;
    const skipBtn = $("#skip-intro") as HTMLElement | null;

    const MIN_VISIBLE_MS = 650;
    const LOAD_TIMEOUT_MS = 3500;
    /* La animación dura 5 s; este margen es para equipos lentos. */
    const PLAY_BUDGET_MS = 9000;
    let animation: AnimationItem | null = null;
    let startedAt: number | null = null;
    let finished = false;

    /** Quita la animación del DOM y corta su bucle de render. */
    const teardown = (): void => {
        try {
            animation?.destroy();
        } catch { }
        animation = null;
        overlay?.remove();
    };

    const finalizeImmediate = (): void => {
        if (finished) return;
        finished = true;
        document.body.removeAttribute("data-intro");
        teardown();
        introResuelta();
        content?.classList.replace("opacity-0", "opacity-100");
        setHeights(heroHeight());
        setRadius("30px");
        document.documentElement.classList.remove("no-scroll");
        document.body.classList.remove("no-scroll");
        (document.documentElement as HTMLElement).style.removeProperty("overflow-y");
        document.body.style.removeProperty("overflow-y");

        waitForFontsReady(() => {
            prepareNavStrokes(navTexts);
            content?.style.removeProperty("clip-path");
            gsap.set("#navBase > *", { opacity: 1, y: 0 });
            animateNavAndParagraph(prefersReduced, navTexts);
            requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("intro:finished")));
            requestAnimationFrame(() => ScrollTrigger?.refresh());
        });
    };

    const runPostIntro = (): void => {
        introResuelta();
        content?.classList.replace("opacity-0", "opacity-100");
        document.body.removeAttribute("data-intro");
        setHeights("100svh");
        setRadius(null);

        prepareNavStrokes(navTexts);

        gsap.set(content, { webkitMaskSize: "0% 0%", maskSize: "0% 0%" });

        const navItems = document.querySelectorAll("#navBase .animate, #navBase .animate > *");
        gsap.set(navItems, { y: 40, opacity: 0 });

        gsap.timeline({ defaults: { overwrite: "auto" } })
            .to(
                content,
                {
                    clipPath: "circle(150% at 50% 50%)",
                    duration: 5,
                    ease: appleOut,
                    onStart: () => {
                        if (overlay) {
                            overlay.style.zIndex = "auto";
                            overlay.style.pointerEvents = "none";
                        }
                    },
                },
                0
            )
            .to(
                ".bg__container, .bg__container__logo",
                {
                    height: heroHeight(),
                    duration: 1,
                    ease: appleOut,
                    onStart: () => {
                        teardown();
                        document.documentElement.classList.remove("no-scroll");
                        document.body.classList.remove("no-scroll");
                        (document.documentElement as HTMLElement).style.removeProperty("overflow-y");
                        document.body.style.removeProperty("overflow-y");
                    },
                },
                1
            )
            .to(
                ".bg__container",
                {
                    borderBottomLeftRadius: "30px",
                    borderBottomRightRadius: "30px",
                    duration: 0.8,
                    ease: appleOut,
                },
                2
            )
            .to(
                navItems,
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: appleOut,
                    stagger: 0.08,
                    /* NavMenu (React) entra con esta misma cascada, no al acabar la intro. */
                    onStart: () => window.dispatchEvent(new CustomEvent("nav:reveal")),
                },
                2
            )
            .call(animateNavAndParagraph, [prefersReduced, navTexts, true], 0)
            .add(() => {
                content?.style.removeProperty("clip-path");
                window.dispatchEvent(new CustomEvent("intro:finished"));
            });
    };

    const finish = (): void => {
        if (finished) return;
        finished = true;
        const elapsed = startedAt ? performance.now() - startedAt : MIN_VISIBLE_MS;
        setTimeout(runPostIntro, Math.max(0, MIN_VISIBLE_MS - elapsed));
    };

    /* La decisión de reproducir la intro ya está tomada: la tomó el script
       en línea de head.astro antes del primer pintado, con la misma regla
       que había aquí (visita nueva —ver src/scripts/visita.ts—, sin
       `prefers-reduced-motion`, sin ahorro de datos ni red lenta). Si no
       marcó la página, el contenido ya está a la vista y no hay nada que
       tapar: se salta directamente al estado final. Con `?intro` en la URL
       se reproduce siempre, también con movimiento reducido: es para
       revisarla a propósito. */
    const forzada = new URLSearchParams(location.search).has("intro");
    if (document.documentElement.dataset.intro !== "pending" || (!forzada && (scrollY > 50 || prefersReduced))) {
        finalizeImmediate();
        return;
    }

    document.documentElement.classList.add("no-scroll");

    const src = stage?.dataset.src;
    if (!stage || !src) {
        finalizeImmediate();
        return;
    }

    /* Si la animación no llega a tiempo (red lenta, fallo de carga), el
       contenido no espera: se muestra sin intro. */
    const loadTimeout = window.setTimeout(() => finalizeImmediate(), LOAD_TIMEOUT_MS);

    on(skipBtn, ["click"], () => {
        clearTimeout(loadTimeout);
        animation?.pause();
        finish();
    });

    /* lottie_light: solo el renderizador SVG, sin expresiones (la animación
       no las usa). Se carga aparte para no pesar en quien no ve la intro. */
    Promise.all([
        import("lottie-web/build/player/lottie_light"),
        fetch(src).then((res) => {
            if (!res.ok) throw new Error(`intro: ${res.status}`);
            return res.json();
        }),
    ])
        .then(([{ default: lottie }, animationData]) => {
            if (finished) return;
            clearTimeout(loadTimeout);

            animation = lottie.loadAnimation({
                container: stage,
                renderer: "svg",
                loop: false,
                autoplay: false,
                animationData,
                rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
            });
            animation.addEventListener("complete", () => finish());
            animation.addEventListener("error", () => finalizeImmediate());

            overlay?.classList.remove("intro-hidden");
            startedAt = performance.now();
            animation.play();

            /* lottie-web avanza con requestAnimationFrame, que el navegador casi
               detiene en una pestaña de fondo. Sin este tope la intro podría
               tardar minutos en llegar a "complete" y el scroll seguiría
               bloqueado, así que solo contamos el tiempo que estuvo a la vista. */
            let visibleMs = 0;
            let lastTick = performance.now();
            const watchdog = window.setInterval(() => {
                const now = performance.now();
                if (!document.hidden) visibleMs += now - lastTick;
                lastTick = now;
                if (finished || visibleMs > PLAY_BUDGET_MS) {
                    clearInterval(watchdog);
                    finish();
                }
            }, 500);
        })
        .catch(() => {
            clearTimeout(loadTimeout);
            finalizeImmediate();
        });
};
