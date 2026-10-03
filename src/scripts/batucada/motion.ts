import { gsap, ScrollTrigger, waitForFontsReady } from "../main";
import { appleOut } from "../easing";
import { CARTOON, SMOOTH, Spring } from "../spring";
import { initCartoon } from "../cartoon";
import { initInPageAnchors } from "../anchors";
import { onWidthResize } from "../viewport";
import { prefersReducedMotion } from "../platform";

/* Clave son 3-2 en semicorcheas de 70ms: golpes en 0, 3, 6, 10, 12.
   Es el patrón de stagger de todas las entradas — el ritmo del tema,
   no un stagger uniforme. */
const CLAVE = [0, 3, 6, 10, 12].map((n) => n * 0.07);

/* Golpe de tambor en cadena: cada tiempo cae, se aplasta contra el parche
   (más ancho y más bajo, desde abajo) y rebota a su forma, uno tras otro de
   izquierda a derecha a 70 ms —una semicorchea—. El acento golpea más fuerte.
   Solo transform: la opacidad de los tiempos apagados es del CSS. */
const drum = (beats: HTMLElement[], fall: boolean) => {
    const tl = gsap.timeline();
    beats.forEach((beat, i) => {
        const strength = beat.classList.contains("bg-accent") ? 1.5 : 1;
        const at = i * 0.07;
        if (fall) tl.fromTo(beat, { y: -18, scaleX: 0.85, scaleY: 1.2, transformOrigin: "50% 100%" }, { y: 0, scaleX: 1, scaleY: 1, duration: 0.16, ease: "power2.in" }, at);
        tl.to(beat, { scaleX: 1 + 0.3 * strength, scaleY: 1 - 0.3 * strength, transformOrigin: "50% 100%", duration: 0.06, ease: "power1.out" }, fall ? at + 0.16 : at).to(beat, { scaleX: 1, scaleY: 1, ...CARTOON }, ">");
    });
    return tl;
};


/* ------------------------------------------------------------------
   Coreografía de scroll: una timeline por escena ([data-bp-scene]).
   Reglas de resiliencia:
   - Con prefers-reduced-motion no se crea ni oculta nada.
   - Solo se preoculta lo que está POR DEBAJO del viewport al iniciar:
     si el navegador restaura el scroll a mitad de página, lo visible
     nunca parpadea ni desaparece.
   - fromTo/to + clearProps deja el DOM limpio al terminar.
   ------------------------------------------------------------------ */
export const initBatucadaMotion = () => {
    if (document.documentElement.dataset.bpMotion === "ready") return;
    document.documentElement.dataset.bpMotion = "ready";
    if (prefersReducedMotion()) return;

    /* Hero: un solo redoble de entrada tras cargar fuentes (evita el
       salto de métricas). Solo si la página abre arriba. */
    const heroItems = gsap.utils.toArray<HTMLElement>("[data-bp-hero]");
    if (heroItems.length && window.scrollY < 40) {
        gsap.set(heroItems, { y: 26, autoAlpha: 0 });
        waitForFontsReady(() => {
            gsap.to(heroItems, {
                y: 0,
                autoAlpha: 1,
                ...CARTOON,
                stagger: (i) => CLAVE[i % CLAVE.length] * 0.85,
                clearProps: "all",
            });
        });
    }

    /* Odómetro (mismo principio que el contador del homepage): las cifras
       cuentan desde cero al entrar en viewport. El HTML ya trae el valor
       final, así que sin JS o con reduced-motion no se pierde nada. */
    document.querySelectorAll<HTMLElement>("[data-bp-count]").forEach((el) => {
        const target = Number(el.dataset.bpCount ?? "");
        if (!Number.isFinite(target) || target <= 0) return;
        const prefix = el.dataset.bpPrefix ?? "";
        const state = { val: 0 };
        ScrollTrigger.create({
            trigger: el,
            start: "top 88%",
            once: true,
            onEnter: () => {
                gsap.to(state, {
                    val: target,
                    duration: 1.7,
                    ease: appleOut,
                    onUpdate: () => {
                        el.textContent = prefix + String(Math.round(state.val));
                    },
                });
            },
        });
    });

    document.querySelectorAll<HTMLElement>("[data-bp-scene]").forEach((scene) => {
        if (scene.getBoundingClientRect().top < window.innerHeight * 0.92) return;

        /* Los títulos con ScrollFloat traen su propia entrada letra a letra: si
           además entran con el resto de la escena, las dos animaciones se pisan. */
        const hits = Array.from(scene.querySelectorAll<HTMLElement>("[data-bp-hit]")).filter((el) => !el.matches("[data-scroll-float]"));
        const lists = Array.from(scene.querySelectorAll<HTMLElement>("[data-bp-clave]"));
        const beats = Array.from(scene.querySelectorAll<HTMLElement>("[data-bp-beats] i"));
        const photos = Array.from(scene.querySelectorAll<HTMLElement>("[data-bp-photo] img"));
        if (!hits.length && !lists.length) return;

        gsap.set(hits, { y: 28, autoAlpha: 0 });
        lists.forEach((list) => gsap.set(list.children, { y: 30, autoAlpha: 0 }));

        ScrollTrigger.create({
            trigger: scene,
            start: "top 78%",
            once: true,
            onEnter: () => {
                const tl = gsap.timeline({ defaults: { ...CARTOON } });
                if (beats.length) tl.add(drum(beats, true), 0);
                if (hits.length) {
                    tl.to(hits, { y: 0, autoAlpha: 1, stagger: (i) => CLAVE[i % CLAVE.length], clearProps: "all" }, 0.05);
                }
                lists.forEach((list, li) => {
                    tl.to(list.children, { y: 0, autoAlpha: 1, stagger: (i) => CLAVE[i % CLAVE.length], clearProps: "all" }, 0.2 + li * 0.12);
                });
                if (photos.length) {
                    /* Sin rebote: la foto llena su marco y bajar de 1 enseñaría el borde. */
                    tl.fromTo(photos, { scale: 1.05 }, { scale: 1, ...SMOOTH, clearProps: "transform" }, 0);
                }
            },
        });
    });

    /* Stickers en gelatina y demás estilos marcados en el HTML (data-jelly…). */
    initCartoon();

    /* Pasar el puntero por una cabecera de compás vuelve a tocar el redoble. */
    document.querySelectorAll<HTMLElement>("[data-bp-beats]").forEach((strip) => {
        const header = strip.closest("header") ?? strip;
        const beats = Array.from(strip.children) as HTMLElement[];
        let playing: gsap.core.Timeline | null = null;
        header.addEventListener("pointerenter", (e) => {
            if (e.pointerType === "touch" || playing?.isActive()) return;
            playing = drum(beats, false);
        });
    });

    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
};

/* ------------------------------------------------------------------
   Línea de pulso: loop horizontal infinito con el mismo principio del
   carrusel del homepage (dos tiras absolutas + gsap.ticker + quickSetter,
   envolviendo por ancho medido — sin saltos de keyframe). Se pausa
   fuera del viewport.
   ------------------------------------------------------------------ */
export const initPulseline = () => {
    document.querySelectorAll<HTMLElement>("[data-bp-pulseline]").forEach((root) => {
        if (root.dataset.ready) return;
        root.dataset.ready = "1";

        const strips = root.querySelectorAll<HTMLElement>("[data-bp-strip]");
        if (strips.length !== 2) return;
        const [s1, s2] = Array.from(strips);

        if (prefersReducedMotion()) return; // tira estática, contenido visible

        /* Garantizar cobertura en pantallas anchas: cada tira debe medir
           al menos un viewport para que el par cubra sin huecos. */
        const ensureWidth = (strip: HTMLElement) => {
            let guard = 0;
            while (strip.scrollWidth < window.innerWidth && guard < 6) {
                strip.append(...Array.from(strip.children, (c) => c.cloneNode(true)));
                guard += 1;
            }
        };

        let x1 = 0;
        let x2 = 0;
        let W = 0;
        let tickerFn: ((...args: number[]) => void) | null = null;
        const setX1 = gsap.quickSetter(s1, "x", "px");
        const setX2 = gsap.quickSetter(s2, "x", "px");

        /* La cinta reacciona a la velocidad del scroll (no a su posición): al
           bajar rápido se inclina hasta 4° y corre hasta el doble, y al parar
           vuelve con el resorte de caricatura. */
        let st: ScrollTrigger | undefined;
        let boost = 1;
        const band = root.firstElementChild as HTMLElement | null;
        const setSkew = band ? gsap.quickSetter(band, "skewX", "deg") : () => {};
        const lean = new Spring(0, "cartoon", (v) => setSkew(v), 0.01);

        const setup = () => {
            if (tickerFn) {
                gsap.ticker.remove(tickerFn);
                tickerFn = null;
            }
            ensureWidth(s1);
            ensureWidth(s2);
            W = s1.scrollWidth;
            if (!W) return;

            x1 = 0;
            x2 = W;
            gsap.set([s1, s2], { force3D: true });
            setX1(x1);
            setX2(x2);

            const PX_PER_SEC = 55;
            tickerFn = () => {
                const k = Math.max(-1, Math.min(1, (st?.getVelocity() ?? 0) / 1500));
                lean.to(-4 * k);
                boost += (1 + Math.abs(k) - boost) * 0.1;
                const dx = (gsap.ticker.deltaRatio() * PX_PER_SEC * boost) / 60;
                x1 -= dx;
                x2 -= dx;
                if (x1 <= -W) x1 += 2 * W;
                if (x2 <= -W) x2 += 2 * W;
                setX1(x1);
                setX2(x2);
            };
            gsap.ticker.add(tickerFn);
        };

        /* Solo cuando cambia el ancho: la barra del navegador móvil dispara
           `resize` al desplazarse y rehacer la marquesina ahí la reiniciaba. */
        onWidthResize(setup);

        st = ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => {
                if (self.isActive) {
                    if (!tickerFn) setup();
                } else if (tickerFn) {
                    gsap.ticker.remove(tickerFn);
                    tickerFn = null;
                    lean.jump(0);
                }
            },
        });
    });
};

/* Las anclas internas viven en `src/scripts/anchors.ts` porque ya no son
   exclusivas de esta página: /donate también salta entre sus dos canales.
   Se conserva el nombre exportado para no tocar a sus consumidores. */
export const initBatucadaAnchors = initInPageAnchors;
