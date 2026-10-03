/* ──────────────────────────────────────────────────────────────────────────
   Resortes del sitio: física de oscilador amortiguado, no curvas dibujadas.

   Se parametrizan como Apple (WWDC 2018, «Designing Fluid Interfaces») y
   como Motion: dos números que un diseñador entiende, no la terna masa /
   rigidez / amortiguación.

   - `response` (s): lo que tarda un ciclo completo de la oscilación. Más bajo,
     más vivo. No es una duración: el tiempo de asentado sale de la física.
   - `bounce` (0–1): cuánto se pasa del destino. 0 es amortiguación crítica
     (llega sin pasarse); el `dampingFraction` de SwiftUI es `1 − bounce`.

   Masa 1 ⇒ rigidez k = (2π / response)² y amortiguación c = 4π·ζ / response.
   La solución es analítica (cerrada), así que un paso de 100 ms tras una
   pestaña en segundo plano es tan exacto como uno de 16 ms: no explota.

   Tres usos:
   1. `springTween(cfg)`: { ease, duration } para un tween de GSAP.
   2. `springLinear(cfg)`: la misma curva como `linear()` de CSS. Las de
      global.css (`--ease-spring-*`) salen de aquí; tests/spring.test.ts
      comprueba que no se desincronicen.
   3. `Spring`: un valor vivo que persigue un destino que cambia (cursor,
      arrastre) conservando la velocidad en cada cambio de destino. Es lo que
      hace que soltar algo lanzado se sienta continuo y no «frene en seco».

   Sin dependencias, como easing.ts: lo pueden importar islas de React y
   scripts que no cargan GSAP.
─────────────────────────────────────────────────────────────────────────── */

export interface SpringConfig {
    /** Periodo de la oscilación en segundos (Apple: `response`). */
    response: number;
    /** 0 = sin rebote (crítico) … 1 = no se detiene nunca. Apple: 1 − dampingFraction. */
    bounce: number;
}

/* Los valores que publica Apple en Designing Fluid Interfaces, más los del
   propio sitio. Minkayni es una marca juguetona: todo lo que se desplaza,
   gira o escala rebota, también las entradas (decisión del 2026-10-02).
   Lo que no rebota nunca: opacidad sola, color, scroll y cifras. */
export const SPRINGS = {
    /** Respuesta inmediata a una pulsación: hundirse y volver. */
    press: { response: 0.3, bounce: 0.4 },
    /** Por defecto en interfaz: llega rápido y sin pasarse (Apple: damping 1, response 0,35). */
    smooth: { response: 0.4, bounce: 0 },
    /** Mover o recolocar con algo de vida (Motion por defecto: bounce 0,25). */
    snappy: { response: 0.42, bounce: 0.25 },
    /** Tras un lanzamiento o en momentos de alegría: rebote visible pero corto. */
    bouncy: { response: 0.55, bounce: 0.4 },
    /** Seguir al cursor: suave, sin latigazos (Apple: mover/PiP 1,0 / 0,4). */
    follow: { response: 0.45, bounce: 0.08 },
    /** Entradas, zooms y hovers con física de caricatura: se pasa ~16 % y vuelve. */
    cartoon: { response: 0.6, bounce: 0.5 },
} as const satisfies Record<string, SpringConfig>;

export type SpringName = keyof typeof SPRINGS;

const TAU = Math.PI * 2;
/* Umbrales de reposo en unidades normalizadas (distancia inicial = 1): por
   debajo de una milésima de recorrido y de velocidad ya no se ve nada. */
const REST_DELTA = 0.001;
const REST_SPEED = 0.01;

const coefficients = ({ response, bounce }: SpringConfig) => {
    const w0 = TAU / Math.max(response, 0.01);
    const zeta = 1 - Math.min(Math.max(bounce, 0), 0.99);
    return { w0, zeta };
};

/**
 * Avanza un resorte `dt` segundos de forma exacta.
 * `x` es la distancia AL destino (posición − destino) y `v` la velocidad, en
 * las unidades que se quiera (px, grados, escala…). Devuelve [x, v].
 */
export function stepSpring(cfg: SpringConfig, x: number, v: number, dt: number): [number, number] {
    const { w0, zeta } = coefficients(cfg);
    if (zeta < 1) {
        const wd = w0 * Math.sqrt(1 - zeta * zeta);
        const decay = Math.exp(-zeta * w0 * dt);
        const B = (v + zeta * w0 * x) / wd;
        const cos = Math.cos(wd * dt);
        const sin = Math.sin(wd * dt);
        const nx = decay * (x * cos + B * sin);
        const nv = decay * ((B * wd - zeta * w0 * x) * cos - (x * wd + zeta * w0 * B) * sin);
        return [nx, nv];
    }
    const decay = Math.exp(-w0 * dt);
    const B = v + w0 * x;
    return [decay * (x + B * dt), decay * (B - w0 * (x + B * dt))];
}

/** Segundos hasta que el resorte queda quieto a la vista, partiendo de 0 → 1 con velocidad normalizada `v0`. */
export function settleTime(cfg: SpringConfig, v0 = 0): number {
    const dt = 1 / 120;
    let x = -1;
    let v = v0;
    let t = 0;
    while (t < 4) {
        [x, v] = stepSpring(cfg, x, v, dt);
        t += dt;
        if (Math.abs(x) < REST_DELTA && Math.abs(v) < REST_SPEED) break;
    }
    return Math.round(t * 1000) / 1000;
}

/**
 * Curva de progreso 0 → 1 del resorte, estirada a su tiempo de asentado.
 * `v0` es la velocidad inicial RELATIVA al recorrido (Apple:
 * `velocidadDelGesto / (destino − actual)`), en recorridos por segundo.
 */
export function springEase(cfg: SpringConfig, v0 = 0): { ease: (t: number) => number; duration: number } {
    const duration = settleTime(cfg, v0);
    const ease = (p: number) => {
        if (p <= 0) return 0;
        if (p >= 1) return 1;
        const [x] = stepSpring(cfg, -1, v0, p * duration);
        return 1 + x;
    };
    return { ease, duration };
}

/**
 * Parámetros listos para `gsap.to(el, { x: 120, ...springTween("snappy") })`.
 * `velocity` en unidades/s y `distance` en las mismas unidades permiten
 * heredar el impulso de un gesto (traspaso de velocidad de Apple).
 */
export function springTween(
    spring: SpringName | SpringConfig,
    handoff?: { velocity: number; distance: number },
): { ease: (t: number) => number; duration: number } {
    const cfg = typeof spring === "string" ? SPRINGS[spring] : spring;
    /* Tope de 5000 px/s: un pico del sensor no debe mandar nada fuera de pantalla. */
    const velocity = handoff ? Math.max(-5000, Math.min(5000, handoff.velocity)) : 0;
    const v0 = handoff && Math.abs(handoff.distance) > 1e-3 ? velocity / handoff.distance : 0;
    return springEase(cfg, v0);
}

/* Atajos para GSAP, calculados una vez: `gsap.to(el, { y: 0, ...CARTOON })`.
   Con opacidad en el mismo tween no hay parpadeo: CSS recorta lo que pasa de
   1 y el valle posterior al rebote no baja del 97 %. */
export const CARTOON = springTween("cartoon");
export const BOUNCY = springTween("bouncy");
export const SNAPPY = springTween("snappy");
export const SMOOTH = springTween("smooth");

/**
 * La curva como `linear()` de CSS, con su duración. Muestreo adaptativo: solo
 * guarda los puntos que la recta entre vecinos no explica (error < `tolerance`),
 * así un resorte cabe en ~40 paradas en vez de 200.
 */
export function springLinear(cfg: SpringConfig, tolerance = 0.002): { easing: string; duration: number } {
    const { ease, duration } = springEase(cfg);
    const N = 400;
    const pts = Array.from({ length: N + 1 }, (_, i) => [i / N, ease(i / N)] as const);
    const keep: (readonly [number, number])[] = [pts[0]];
    let anchor = 0;
    for (let i = 2; i <= N; i++) {
        const [ax, ay] = pts[anchor];
        const [bx, by] = pts[i];
        let fits = true;
        for (let j = anchor + 1; j < i; j++) {
            const [px, py] = pts[j];
            const yLine = ay + ((by - ay) * (px - ax)) / (bx - ax);
            if (Math.abs(yLine - py) > tolerance) {
                fits = false;
                break;
            }
        }
        if (!fits) {
            keep.push(pts[i - 1]);
            anchor = i - 1;
        }
    }
    keep.push(pts[N]);
    const round = (n: number, d: number) => String(Math.round(n * 10 ** d) / 10 ** d);
    const stops = keep.map(([x, y], i) => (i === 0 || i === keep.length - 1 ? round(y, 3) : `${round(y, 3)} ${round(x * 100, 1)}%`));
    return { easing: `linear(${stops.join(", ")})`, duration: Math.round(duration * 1000) };
}

/* ── Gestos ─────────────────────────────────────────────────────────────── */

/** Velocidad del puntero (px/s) a partir de las últimas muestras, no de la última sola. */
export class VelocityTracker {
    private samples: { t: number; x: number; y: number }[] = [];

    constructor(private windowMs = 100) {}

    reset(): void {
        this.samples.length = 0;
    }

    add(x: number, y: number, t = performance.now()): void {
        this.samples.push({ t, x, y });
        while (this.samples.length > 2 && t - this.samples[0].t > this.windowMs) this.samples.shift();
    }

    /** px/s. Si el puntero lleva quieto más que la ventana, la velocidad es 0. */
    velocity(now = performance.now()): { x: number; y: number } {
        const s = this.samples;
        if (s.length < 2 || now - s[s.length - 1].t > this.windowMs) return { x: 0, y: 0 };
        const a = s[0];
        const b = s[s.length - 1];
        const dt = (b.t - a.t) / 1000;
        if (dt <= 0) return { x: 0, y: 0 };
        return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
    }
}

/**
 * Dónde acabaría un lanzamiento si siguiera decelerando como el scroll de iOS
 * (función de proyección de Apple). 0,998 es el scroll normal; 0,99, más corto.
 */
export const project = (velocity: number, decelerationRate = 0.998): number =>
    ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);

/** Resistencia progresiva al pasar de un límite: se nota que no hay más, sin topar en seco. */
export const rubberband = (overshoot: number, dimension: number, constant = 0.55): number =>
    (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));

/* ── Valor vivo ─────────────────────────────────────────────────────────── */

type Ticker = { add(cb: () => void): void; remove(cb: () => void): void };

/* Un único bucle rAF para todos los resortes vivos de la página, que se
   apaga cuando todos están en reposo. GSAP tiene su ticker, pero este módulo
   no lo importa para poder usarse sin GSAP. */
const rafTicker: Ticker = (() => {
    const subs = new Set<() => void>();
    let id = 0;
    const loop = () => {
        subs.forEach((cb) => cb());
        id = subs.size ? requestAnimationFrame(loop) : 0;
    };
    return {
        add(cb) {
            subs.add(cb);
            if (!id) id = requestAnimationFrame(loop);
        },
        remove(cb) {
            subs.delete(cb);
        },
    };
})();

/**
 * Un número que persigue su destino con física. Cambiar el destino a mitad de
 * camino conserva la velocidad: nunca hay salto ni frenazo.
 *
 *   const sx = new Spring(0, "follow", (v) => (el.style.translate = `${v}px 0`));
 *   sx.to(80);                       // perseguir
 *   sx.to(0, { velocity: 1400 });    // soltar heredando el impulso del gesto
 */
export class Spring {
    value: number;
    velocity = 0;
    target: number;
    private cfg: SpringConfig;
    private last = 0;
    private running = false;
    private precision: number;

    constructor(
        initial: number,
        spring: SpringName | SpringConfig,
        private onUpdate: (value: number, velocity: number) => void,
        /** Unidad mínima visible (px ⇒ 0,05; escala ⇒ 0,0005). */
        precision = 0.05,
    ) {
        this.value = this.target = initial;
        this.cfg = typeof spring === "string" ? SPRINGS[spring] : spring;
        this.precision = precision;
    }

    /** Cambia el destino (y opcionalmente impone velocidad, en unidades/s). */
    to(target: number, opts?: { velocity?: number; spring?: SpringName | SpringConfig }): this {
        this.target = target;
        if (opts?.velocity !== undefined) this.velocity = opts.velocity;
        if (opts?.spring) this.cfg = typeof opts.spring === "string" ? SPRINGS[opts.spring] : opts.spring;
        this.start();
        return this;
    }

    /** Coloca el valor sin animar (p. ej. 1:1 bajo el dedo durante un arrastre). */
    jump(value: number, velocity = 0): this {
        this.value = this.target = value;
        this.velocity = velocity;
        this.stop();
        this.onUpdate(value, velocity);
        return this;
    }

    stop(): void {
        if (!this.running) return;
        this.running = false;
        rafTicker.remove(this.tick);
    }

    private start(): void {
        if (this.running) return;
        this.running = true;
        this.last = performance.now();
        rafTicker.add(this.tick);
    }

    private tick = (): void => {
        const now = performance.now();
        /* Tope de 64 ms: si la pestaña estuvo oculta, no se teletransporta. */
        const dt = Math.min((now - this.last) / 1000, 0.064);
        this.last = now;
        const [x, v] = stepSpring(this.cfg, this.value - this.target, this.velocity, dt);
        this.velocity = v;
        if (Math.abs(x) < this.precision && Math.abs(v) < this.precision * 10) {
            this.value = this.target;
            this.velocity = 0;
            this.stop();
        } else {
            this.value = this.target + x;
        }
        this.onUpdate(this.value, this.velocity);
    };
}
