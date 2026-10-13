/* PixelCurtain — la transición entre páginas, hecha con la rejilla de píxeles
   de PixelSwap (reactbits.dev/animations/pixel-swap).

   PixelSwap intercambia dos contenidos dentro de una caja; aquí no hay dos
   contenidos, hay dos PÁGINAS, y el sitio es estático: cada enlace carga un
   documento nuevo. Por eso el componente se parte en dos mitades:

   1. Al pulsar un enlace interno, los píxeles crecen hasta cubrir la pantalla
      (mismo `buildGrid`, mismo `coverScale`, mismas keyframes que el
      original) y solo entonces se navega. Se deja una marca en sessionStorage.
   2. La página nueva arranca ya cubierta —un script inline en el <head> lee la
      marca antes del primer pintado y pone `data-curtain="covered"` en <html>,
      y una regla CSS tapa el documento— y esta isla, al hidratar, retira los
      píxeles en orden inverso.

   Radio del 50%: cada píxel es un círculo, la forma redonda que usa el resto
   del sitio. Con `prefers-reduced-motion` no hay animación: se navega y ya.

   Las funciones puras (rejilla, easing, keyframes) están copiadas tal cual
   del original para que el movimiento sea idéntico. */
import { useEffect, useRef, useState } from 'react';
import { APPLE_OUT_CSS } from '../../scripts/easing';

type Pattern = 'random' | 'center' | 'edges' | 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top' | 'diagonal' | 'spiral';

interface Pixel { id: number; left: number; top: number; offset: number }
interface Grid { pixels: Pixel[]; size: number; gap: number; width: number; height: number }

const MAX_PIXELS = 220;
const KEYFRAME_STEPS = 14;
const STORAGE_KEY = 'pixel-curtain';

const PATTERNS: Record<Pattern, (x: number, y: number) => number | null> = {
  random: () => null,
  center: (x, y) => Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2,
  edges: (x, y) => Math.min(x, 1 - x, y, 1 - y) * 2,
  'left-to-right': x => x,
  'right-to-left': x => 1 - x,
  'top-to-bottom': (_x, y) => y,
  'bottom-to-top': (_x, y) => 1 - y,
  diagonal: (x, y) => (x + y) / 2,
  spiral: (x, y) => {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
    const radius = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
    return (angle + radius) % 1;
  }
};

const EASINGS: Record<string, number[]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1]
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const noise = (seed: number): number => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const makeEasing = (value: string): ((progress: number) => number) => {
  const match = /cubic-bezier\(([^)]+)\)/.exec(value);
  const points = match ? match[1].split(',').map(Number) : EASINGS[value];
  if (!points || points.length !== 4 || points.some(Number.isNaN)) return makeEasing('ease');

  const [x1, y1, x2, y2] = points;
  if (x1 === y1 && x2 === y2) return (progress: number) => progress;

  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  return (progress: number) => {
    let t = progress;
    for (let i = 0; i < 5; i += 1) {
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (!slope) break;
      t -= (((ax * t + bx) * t + cx) * t - progress) / slope;
    }
    t = clamp(t, 0, 1);
    return ((ay * t + by) * t + cy) * t;
  };
};

const coverScale = (size: number, gap: number, radius: number): number => {
  const p = clamp(radius, 0, 50) / 100;
  const corner = Math.SQRT1_2 / (Math.SQRT2 * (0.5 - p) + p);
  return ((size + gap) / size) * Math.max(1, corner);
};

const buildGrid = ({ width, height, pixelSize, gap, pattern, randomness }: { width: number; height: number; pixelSize: number; gap: number; pattern: Pattern; randomness: number }): Grid => {
  let size = pixelSize;
  let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
  let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));

  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  }

  const stride = size + gap;
  const originX = (width - (columns * stride - gap)) / 2;
  const originY = (height - (rows * stride - gap)) / 2;
  const order = PATTERNS[pattern] ?? PATTERNS.random;
  const mix = clamp(randomness, 0, 1);
  const pixels: Pixel[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const x = columns <= 1 ? 0.5 : column / (columns - 1);
      const y = rows <= 1 ? 0.5 : row / (rows - 1);
      const base = order(x, y);
      const random = noise(index + 1);
      pixels.push({ id: index, left: originX + column * stride, top: originY + row * stride, offset: base === null ? random : base * (1 - mix) + random * mix });
    }
  }

  return { pixels, size, gap, width, height };
};

/* Solo la mitad «ventana» de las keyframes del original: aquí el píxel es un
   disco de color sólido, no una ventana sobre otro contenido. */
const buildKeyframes = ({ ease, startScale, endScale, spin, fade }: { ease: (p: number) => number; startScale: number; endScale: number; spin: number; fade: boolean }): Keyframe[] => {
  const frames: Keyframe[] = [];
  for (let step = 0; step <= KEYFRAME_STEPS; step += 1) {
    const progress = step / KEYFRAME_STEPS;
    const eased = ease(progress);
    const scale = startScale + (endScale - startScale) * eased;
    const angle = spin * (1 - eased);
    frames.push({ offset: progress, opacity: fade ? Math.min(1, eased * 1.6) : 1, transform: `rotate(${angle}deg) scale(${scale})` });
  }
  return frames;
};

export interface PixelCurtainProps {
  color?: string;
  pixelSize?: number;
  gap?: number;
  /** 0–50. Al 50% cada píxel es un círculo. */
  pixelRadius?: number;
  pixelScale?: number;
  pixelSpin?: number;
  duration?: number;
  pixelDuration?: number;
  pattern?: Pattern;
  randomness?: number;
  easing?: string;
}

const isInternalNavigation = (anchor: HTMLAnchorElement, event: MouseEvent): boolean => {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  const href = anchor.getAttribute('href') ?? '';
  if (!href || href.startsWith('#') || /^(mailto|tel|sms|javascript):/i.test(href)) return false;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return false;
  /* Misma página con distinto ancla: es un desplazamiento, no una navegación. */
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
  /* Un archivo (/media/foto.jpg, un PDF) no es una página: no la llamaría
     nadie para retirar la cortina, que se quedaría tapándolo. */
  if (/\.(?!html?$)[a-z0-9]{2,5}$/i.test(url.pathname)) return false;
  return true;
};

export default function PixelCurtain({
  color = 'var(--primary)',
  pixelSize = 64,
  gap = 0,
  pixelRadius = 50,
  pixelScale = 0.35,
  pixelSpin = 0,
  duration = 720,
  pixelDuration = 380,
  pattern = 'random',
  randomness = 0,
  easing = APPLE_OUT_CSS
}: PixelCurtainProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  /* `covered` es el estado inicial de una página a la que se llegó con la
     cortina puesta: el disco sólido tapa todo hasta que los píxeles se retiran. */
  const [phase, setPhase] = useState<'idle' | 'covered' | 'animating'>('idle');
  const busy = useRef(false);

  const run = (root: HTMLDivElement, direction: 'in' | 'out'): Promise<void> => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const grid = buildGrid({ width, height, pixelSize: Math.max(8, Math.round(pixelSize)), gap: Math.max(0, Math.round(gap)), pattern, randomness });
    const total = Math.max(200, duration);
    const pixelMs = clamp(pixelDuration, 60, total);
    const spread = Math.max(0, total - pixelMs);
    const endScale = coverScale(grid.size, grid.gap, pixelRadius);
    const frames = buildKeyframes({ ease: makeEasing(easing), startScale: clamp(pixelScale, 0.05, 1) * endScale, endScale, spin: pixelSpin, fade: true });
    const keyframes = direction === 'in' ? frames : [...frames].reverse().map((f, i) => ({ ...f, offset: i / KEYFRAME_STEPS }));

    root.replaceChildren();
    const animations: Animation[] = [];
    for (const pixel of grid.pixels) {
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;left:${pixel.left}px;top:${pixel.top}px;width:${grid.size}px;height:${grid.size}px;border-radius:${clamp(pixelRadius, 0, 50)}%;background:${color};opacity:0;contain:paint;will-change:transform,opacity`;
      root.appendChild(el);
      /* Al retirarse, los píxeles que llegaron últimos se van primero. */
      const delay = (direction === 'in' ? pixel.offset : 1 - pixel.offset) * spread;
      animations.push(el.animate(keyframes, { duration: pixelMs, delay, easing: 'linear', fill: 'both' }));
    }
    return Promise.all(animations.map(a => a.finished.catch(() => undefined))).then(() => undefined);
  };

  /* Llegada: si el <head> marcó la página como cubierta, retirar la cortina. */
  useEffect(() => {
    const html = document.documentElement;
    const arrivedCovered = html.dataset.curtain === 'covered';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* sin storage: sin cortina */ }

    if (!arrivedCovered) return;
    if (reduced || !rootRef.current) {
      delete html.dataset.curtain;
      return;
    }

    setPhase('covered');
    const root = rootRef.current;
    /* Dos frames: el disco sólido de la isla ya pinta antes de soltar la
       regla CSS del <head>, así no hay ni un frame de página desnuda. */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      delete html.dataset.curtain;
      setPhase('animating');
      run(root, 'out').then(() => setPhase('idle'));
    }));
  }, []);

  /* Salida: interceptar los enlaces internos. */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || !isInternalNavigation(anchor, event) || busy.current) return;
      const root = rootRef.current;
      if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      event.preventDefault();
      busy.current = true;
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* sin storage: la página nueva llega sin cubrir, y ya */ }
      setPhase('animating');
      const go = () => { location.assign(anchor.href); };
      run(root, 'in').then(go, go);
    };

    /* Volver con el botón «atrás» desde la caché del navegador: limpiar. */
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      busy.current = false;
      setPhase('idle');
      rootRef.current?.replaceChildren();
    };

    /* En `window` y en burbuja, el último en enterarse: si un componente ya se
       quedó con el clic (la galería abre su visor en vez de ir a la foto), lo
       marcó con preventDefault y la cortina no se mete. */
    window.addEventListener('click', onClick);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  /* El navbar elige su tinta mirando lo que hay justo debajo; mientras la
     cortina cubre, esa lectura da el color de la cortina. Se le avisa en
     cuanto deja de tapar para que vuelva a mirar la página de verdad. */
  useEffect(() => {
    if (phase !== 'idle') return;
    window.dispatchEvent(new CustomEvent('curtain:done'));
  }, [phase]);

  return (
    <div
      aria-hidden="true"
      data-pixel-curtain
      data-phase={phase}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: phase === 'idle' ? 'none' : 'auto',
        background: phase === 'covered' ? color : 'transparent',
        overflow: 'hidden'
      }}
    >
      <div ref={rootRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
