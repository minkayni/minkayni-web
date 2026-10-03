/* ──────────────────────────────────────────────────────────────────────────
   Estilos de movimiento «de caricatura» sobre los resortes de spring.ts.

   - squash: aplastar y estirar (golpe, aterrizaje, pulsación). Conserva el
     volumen: lo que se ensancha se achata.
   - jelly: gelatina; tiembla en escala y sesgo, cada vez menos.
   - echo: cadena por rango; el elemento tocado se mueve y sus vecinos lo
     siguen con retraso y menos amplitud.
   - waveFrom: onda que sale desde un punto (el cursor) y llega antes a lo
     que está cerca.
   - letterChain: un texto partido en letras que saltan una tras otra.

   Todo es mejora progresiva: con movimiento reducido no hace nada y el
   estado final siempre es el de reposo. Escribe `transform` con GSAP; los
   elementos pueden llevar la utilidad CSS `spring` (anima `translate`,
   `scale` y `rotate` sueltos, que se suman a este `transform`).
─────────────────────────────────────────────────────────────────────────── */
import { gsap, SplitText } from "./main";
import { prefersReducedMotion } from "./platform";
import { BOUNCY, CARTOON } from "./spring";

const still = () => prefersReducedMotion();

/** Aplasta y estira desde un borde (`origin`) y vuelve rebotando. `amount` 0,1–0,3. */
export function squash(el: Element | null, { amount = 0.18, origin = "50% 100%", axis = "y" }: { amount?: number; origin?: string; axis?: "x" | "y" } = {}): void {
    if (!el || still()) return;
    const short = 1 - amount;
    const wide = 1 + amount;
    gsap.killTweensOf(el, "scaleX,scaleY");
    gsap.fromTo(
        el,
        axis === "y" ? { scaleX: wide, scaleY: short, transformOrigin: origin } : { scaleX: short, scaleY: wide, transformOrigin: origin },
        { scaleX: 1, scaleY: 1, ...CARTOON, overwrite: "auto" },
    );
}

/** Gelatina: tiembla y se asienta. `strength` 0,5–1,5. */
export function jelly(el: Element | null, strength = 1): void {
    if (!el || still()) return;
    gsap.killTweensOf(el, "scaleX,scaleY,skewX");
    const k = strength;
    gsap.timeline({ defaults: { duration: 0.11, ease: "sine.inOut" } })
        .to(el, { scaleX: 1 + 0.1 * k, scaleY: 1 - 0.1 * k, skewX: -3 * k })
        .to(el, { scaleX: 1 - 0.06 * k, scaleY: 1 + 0.06 * k, skewX: 2 * k })
        .to(el, { scaleX: 1 + 0.03 * k, scaleY: 1 - 0.03 * k, skewX: -1 * k })
        .to(el, { scaleX: 1, scaleY: 1, skewX: 0, ...BOUNCY });
}

/**
 * Cadena por rango: `items[index]` se desplaza `y` px y gira `rotate`°, y
 * cada vecino lo sigue con `falloff` de la amplitud del anterior y `lag` s
 * de retraso. Devuelve cómo soltarla.
 */
export function echo(
    items: Element[],
    index: number,
    { y = -6, rotate = -6, falloff = 0.5, lag = 0.045, reach = 3 }: { y?: number; rotate?: number; falloff?: number; lag?: number; reach?: number } = {},
): () => void {
    if (still() || index < 0) return () => {};
    const touched: Element[] = [];
    items.forEach((el, i) => {
        const rank = Math.abs(i - index);
        if (rank > reach) return;
        const amp = falloff ** rank;
        /* Los vecinos se inclinan hacia el tocado, como eslabones: el de la
           izquierda levanta su lado derecho y el de la derecha, el izquierdo. */
        const lean = Math.sign(-y) * Math.abs(rotate) * amp * (i < index ? -1 : 1);
        touched.push(el);
        gsap.to(el, { y: y * amp, rotate: rank === 0 ? rotate : lean, ...CARTOON, delay: rank * lag, overwrite: "auto" });
    });
    return () => touched.forEach((el) => gsap.to(el, { y: 0, rotate: 0, ...BOUNCY, overwrite: "auto" }));
}

/** Onda desde un punto de la pantalla: cada elemento salta `y` px con un retraso proporcional a su distancia. */
export function waveFrom(items: Element[], x: number, y: number, { lift = -5, msPerPx = 0.6, scale = 0.96 }: { lift?: number; msPerPx?: number; scale?: number } = {}): void {
    if (still()) return;
    items.forEach((el) => {
        const r = el.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
        gsap.fromTo(el, { y: lift, scale }, { y: 0, scale: 1, ...CARTOON, delay: (d * msPerPx) / 1000, overwrite: "auto" });
    });
}

/**
 * Parte `el` en letras y devuelve cómo hacerlas saltar en cadena desde la
 * letra `from` (índice, o "start"/"center"). Las letras quedan ocultas al
 * lector de pantalla y el texto completo va como `aria-label` en `labelHost`
 * (un enlace o un título: un `span` no admite `aria-label`). `revert`
 * deshace el partido y la etiqueta.
 */
export function letterChain(el: HTMLElement, labelHost: HTMLElement = el): { play: (from?: number | "start" | "center") => void; revert: () => void } | null {
    if (still()) return null;
    const hadLabel = labelHost.hasAttribute("aria-label");
    if (!hadLabel) labelHost.setAttribute("aria-label", (el.textContent ?? "").trim());
    const split = new SplitText(el, { type: "chars", charsClass: "cartoon-char", aria: "hidden" });
    const chars = split.chars as HTMLElement[];
    gsap.set(chars, { display: "inline-block", transformOrigin: "50% 100%" });
    const play = (from: number | "start" | "center" = "start") => {
        const origin = from === "start" ? 0 : from === "center" ? (chars.length - 1) / 2 : from;
        chars.forEach((c, i) => {
            const rank = Math.abs(i - origin);
            gsap.timeline({ delay: rank * 0.025 })
                .to(c, { y: "-0.14em", rotate: i % 2 ? 5 : -5, duration: 0.12, ease: "power2.out", overwrite: "auto" })
                .to(c, { y: 0, rotate: 0, ...CARTOON });
        });
    };
    return {
        play,
        revert: () => {
            split.revert();
            if (!hadLabel) labelHost.removeAttribute("aria-label");
        },
    };
}

/**
 * Engancha `echo` a una lista: al entrar el puntero en un hijo, ese hijo salta
 * y sus vecinos lo siguen; al salir de la lista, todos vuelven. En táctil
 * responde al tocar. Guarda anti doble inicialización en el propio elemento.
 */
export function bindChain(list: HTMLElement | null, options?: Parameters<typeof echo>[2]): void {
    if (!list || list.dataset.chainReady || still()) return;
    list.dataset.chainReady = "true";
    const items = () => Array.from(list.children) as HTMLElement[];
    let release = () => {};
    const touch = (e: PointerEvent) => {
        const all = items();
        const index = all.findIndex((el) => el.contains(e.target as Node));
        if (index < 0) return;
        release = echo(all, index, options);
    };
    list.addEventListener("pointerover", touch);
    list.addEventListener("pointerdown", touch);
    list.addEventListener("pointerleave", () => release());
}

/** Onda al entrar el puntero en la lista: sale desde donde entra y recorre los hijos. */
export function bindWave(list: HTMLElement | null): void {
    if (!list || list.dataset.waveReady || still()) return;
    list.dataset.waveReady = "true";
    list.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "touch") return;
        waveFrom(Array.from(list.children), e.clientX, e.clientY);
    });
}

/** Gelatina al pasar el puntero por un hijo; sus vecinos tiemblan con eco más flojo. */
export function bindJelly(list: HTMLElement | null): void {
    if (!list || list.dataset.jellyReady || still()) return;
    list.dataset.jellyReady = "true";
    list.addEventListener("pointerover", (e) => {
        if (e.pointerType === "touch") return;
        const items = Array.from(list.children);
        const index = items.findIndex((el) => el.contains(e.target as Node));
        const item = items[index];
        if (!item || item.contains(e.relatedTarget as Node) || gsap.isTweening(item)) return;
        jelly(item);
        gsap.delayedCall(0.06, () => [items[index - 1], items[index + 1]].forEach((n) => n && !gsap.isTweening(n) && jelly(n, 0.35)));
    });
}

const num = (v: string | undefined) => (v === undefined || v === "" ? undefined : Number(v));

/**
 * Engancha lo marcado en el HTML: `data-chain` (opcional `data-chain-y`,
 * `data-chain-rotate`, `data-chain-reach`), `data-wave` y `data-jelly`.
 */
export const initCartoon = (root: ParentNode = document): void => {
    root.querySelectorAll<HTMLElement>("[data-chain]").forEach((el) =>
        bindChain(el, {
            y: num(el.dataset.chainY),
            rotate: num(el.dataset.chainRotate),
            reach: num(el.dataset.chainReach),
        }),
    );
    root.querySelectorAll<HTMLElement>("[data-wave]").forEach((el) => bindWave(el));
    root.querySelectorAll<HTMLElement>("[data-jelly]").forEach((el) => bindJelly(el));
};

/** Entrada en ola: los elementos suben, crecen un pelo y aparecen uno tras otro con rebote. */
export function popIn(items: Element[], { y = 24, scale = 0.97, stagger = 0.06 }: { y?: number; scale?: number; stagger?: number } = {}): void {
    if (still() || !items.length) return;
    gsap.fromTo(items, { y, scale, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, ...CARTOON, stagger, overwrite: "auto", clearProps: "transform,opacity,visibility" });
}
