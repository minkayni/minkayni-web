/* ──────────────────────────────────────────────────────────────────────────
   ScrollFloat — la animación de ScrollFloat
   (reactbits.dev/text-animations/scroll-float) aplicada a los títulos de
   sección del sitio.

   El original es un <h2> que recibe un texto plano y lo parte letra a letra.
   Aquí los títulos ya están en el HTML, en 24 archivos, y 68 de los 70 llevan
   marcado (una palabra en color, una cursiva, un salto de línea) que un
   `split('')` destruiría. Así que se buscan los `h2[data-scroll-float]`, se
   parten SOLO los nodos de texto en letras y se dejan intactos los elementos
   que los envuelven. El tween de GSAP es el del original, valor por valor.

   Fue una isla de React, y React no hacía nada en ella: pintaba `null` y
   usaba un `useEffect` para arrancar esto. Aun así costaba la hidratación, y
   era la isla más cara de la portada: quitarla recortaba el bloqueo del hilo
   principal de 1001 a 613 ms (CPU frenada 4x, como en PageSpeed). El coste
   de verdad estaba en el trabajo, y aquí se reparte:

   - Cada título se prepara cuando se acerca a la pantalla, no todos al
     cargar. La animación empieza cuando el centro del título está medio
     viewport por debajo del borde inferior; el observador se adelanta con
     margen de sobra (dos pantallas), así que nadie ve un título a medio
     preparar. Los que ya están cerca al cargar se preparan enseguida.
   - `will-change` solo mientras la animación de ese título está activa. Antes
     se quedaba puesto en cada letra para siempre: cientos de capas de
     composición que nadie estaba moviendo.

   Dos cuidados que el original no tiene porque sus demos son cortas:
   - Cada palabra va en un `nowrap`: con las letras sueltas como
     inline-block, el navegador partía línea a mitad de palabra.
   - Un lector de pantalla leería las letras una a una, así que el h2 recibe
     `aria-label` con el texto completo y el contenido partido queda
     `aria-hidden`.

   Los títulos que aparecen DESPUÉS de cargar (la vista previa de borradores
   del constructor pinta el contenido tras pedirlo al CMS) se anuncian con el
   evento `scrollfloat:scan` y reciben la misma animación.
─────────────────────────────────────────────────────────────────────────── */
import { gsap } from "./main";
import { appleOut } from "./easing";
import { prefersReducedMotion } from "./platform";
import { CARTOON } from "./spring";

const ANIMATION = {
    duration: 1,
    ease: appleOut,
    scrollStart: "center bottom+=50%",
    scrollEnd: "bottom bottom-=40%",
    stagger: 0.03,
} as const;

/* Segunda capa, la del titular del proyecto destacado (Projects.astro), que
   el usuario eligió como modelo: cada letra sube desde debajo de su línea con
   el resorte de caricatura, en cascada, y se deshace al volver hacia arriba.
   Allí sale desde el centro (bilateral); aquí, de izquierda a derecha. Se
   dispara donde se dispara aquel: su sección cruza el 75 % de la pantalla y
   el titular queda 112 px más abajo. Va en un <span> interior de cada letra
   para no pisar el estirón de ScrollFloat, que mueve el exterior. */
const SPRING_LAYER = {
    yPercent: 120,
    stagger: 0.02,
    start: () => `top ${Math.round(window.innerHeight * 0.75 + 112)}px`,
} as const;

/** Distancia de sobra por debajo de la pantalla a la que ya se prepara un título. */
const ANTICIPO = "0px 0px 200% 0px";

const splitTextNodes = (root: HTMLElement): HTMLElement[] => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if ((node.nodeValue ?? "").trim()) textNodes.push(node as Text);
    }

    const chars: HTMLElement[] = [];
    for (const node of textNodes) {
        const fragment = document.createDocumentFragment();
        for (const token of (node.nodeValue ?? "").split(/(\s+)/)) {
            if (!token) continue;
            if (/^\s+$/.test(token)) {
                /* Un espacio normal entre palabras: ahí sí puede partir la línea. */
                fragment.appendChild(document.createTextNode(" "));
                continue;
            }
            const word = document.createElement("span");
            word.className = "inline-block whitespace-nowrap";
            for (const char of token) {
                const span = document.createElement("span");
                span.className = "inline-block";
                const inner = document.createElement("span");
                inner.className = "sf-spring inline-block";
                inner.textContent = char;
                span.appendChild(inner);
                word.appendChild(span);
                chars.push(span);
            }
            fragment.appendChild(word);
        }
        node.parentNode?.replaceChild(fragment, node);
    }
    return chars;
};

const enhance = (el: HTMLElement) => {
    if (el.dataset.scrollFloatReady) return;
    el.dataset.scrollFloatReady = "1";

    /* La lectura antes de cualquier escritura: leer el margen después de
       tocar el título obligaba a recalcular el diseño de toda la página. */
    const margin = getComputedStyle(el).marginBottom;

    el.setAttribute("aria-label", (el.textContent ?? "").replace(/\s+/g, " ").trim());

    const inner = document.createElement("span");
    inner.setAttribute("aria-hidden", "true");
    inner.className = "inline-block max-w-full";
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);

    /* El original recorta con overflow-hidden para que las letras suban desde
       fuera, pero eso recorta también a los lados y estos títulos se ajustan
       al ancho de su texto: el último glifo se quedaba fuera. .clip-reveal
       recorta solo en vertical (ver global.css). El aire de abajo sigue
       haciendo falta: los interlineados son muy prietos y la tinta de
       Aristotelica mide 1,10 em. */
    el.classList.add("clip-reveal");
    el.style.paddingBottom = "0.14em";
    el.style.marginBottom = `calc(${margin} - 0.14em)`;

    const chars = splitTextNodes(inner);
    if (!chars.length) return;

    gsap.fromTo(
        chars,
        { opacity: 0, yPercent: 120, scaleY: 2.3, scaleX: 0.7, transformOrigin: "50% 0%" },
        {
            duration: ANIMATION.duration,
            ease: ANIMATION.ease,
            opacity: 1,
            yPercent: 0,
            scaleY: 1,
            scaleX: 1,
            stagger: ANIMATION.stagger,
            scrollTrigger: {
                trigger: el,
                start: ANIMATION.scrollStart,
                end: ANIMATION.scrollEnd,
                scrub: true,
                /* Capas de composición solo mientras las letras se mueven. */
                onToggle: (self) => gsap.set(chars, { willChange: self.isActive ? "opacity, transform" : "auto" }),
            },
        }
    );

    /* El titular destacado ya trae su propia capa (desde el centro). */
    if (el.closest("#featured-project")) return;
    const springs = chars.map((c) => c.firstElementChild as HTMLElement);
    gsap.from(springs, {
        yPercent: SPRING_LAYER.yPercent,
        opacity: 0,
        ...CARTOON,
        stagger: { each: SPRING_LAYER.stagger, from: "start" },
        scrollTrigger: {
            trigger: el,
            start: SPRING_LAYER.start,
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
        },
    });
};

const pendientes = () =>
    Array.from(document.querySelectorAll<HTMLElement>("h2[data-scroll-float]")).filter(
        (el) => !el.dataset.scrollFloatReady && !el.dataset.scrollFloatWatched && !el.classList.contains("sr-only") && (el.textContent ?? "").trim()
    );

export const initScrollFloat = (): void => {
    if (document.documentElement.dataset.scrollFloat === "ready") return;
    document.documentElement.dataset.scrollFloat = "ready";
    if (prefersReducedMotion()) return;

    const observador = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observador.unobserve(entry.target);
                enhance(entry.target as HTMLElement);
            }
        },
        { rootMargin: ANTICIPO }
    );

    const vigilar = () => {
        for (const el of pendientes()) {
            el.dataset.scrollFloatWatched = "1";
            observador.observe(el);
        }
    };

    vigilar();
    window.addEventListener("scrollfloat:scan", vigilar);
};
