/* SiteMenu — el panel del Staggered Menu de reactbits
   (reactbits.dev/components/staggered-menu) con los colores y las formas de
   la marca.

   Qué se conserva del original: las capas previas que entran antes del panel,
   la entrada escalonada de los ítems (yPercent 140 y 10° de giro → 0) y el
   pie que aparece al final; tiempos y escalonados de los ítems idénticos.

   Qué se adapta:
   - Colores: capas celeste y ámbar, panel morado, tinta crema.
   - Forma: en vez de barrer desde la derecha, capas y panel son círculos
     (`clip-path: circle()`) que nacen en la hamburguesa y crecen hasta tapar
     toda la página; la identidad redonda del sitio sin esquinas descubiertas.
   - Sin la numeración flotante de los ítems.
   - «Proyectos» no es un enlace sino un acordeón: al pulsarlo se despliegan
     todos los proyectos del CMS con su propio escalonado. El primero de la
     lista lleva a la página de proyectos.
   - Pie: iconos de redes, correo de contacto, transparencia legal e idiomas,
     como en el menú anterior del sitio.
   - El botón es la hamburguesa animada de siempre (BurgerIcon.astro), fuera
     de este árbol: se hablan por eventos `site-menu:toggle` / `site-menu:state`. */
import { type ReactElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { apple, appleOut } from "../../scripts/easing";
import { CARTOON } from "../../scripts/spring";
import type { MenuData } from './menu-types';

/* Círculo de recorte centrado en la hamburguesa (o en la esquina superior
   derecha si no está en pantalla). */
const circleAt = (radius: number) => {
  const rect = document.getElementById('site-menu-button')?.getBoundingClientRect();
  const cx = rect && rect.width > 0 ? rect.left + rect.width / 2 : window.innerWidth - 48;
  const cy = rect && rect.width > 0 ? rect.top + rect.height / 2 : 45;
  return `circle(${radius}px at ${cx}px ${cy}px)`;
};

/* Radio que cubre la ventana entera desde cualquier origen. */
const coverRadius = () => Math.hypot(window.innerWidth, window.innerHeight) * 1.05;

/* Iconos de redes: trazos simples, un solo color (currentColor). */
const SOCIAL_ICONS: Record<string, ReactElement> = {
  facebook: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zM17.61 20.64h2.04L6.49 3.24H4.3z" />
    </svg>
  )
};

const socialIcon = (label: string) => {
  const key = label.toLowerCase();
  if (key.includes('x') && key.includes('twitter')) return SOCIAL_ICONS.x;
  return SOCIAL_ICONS[key] ?? SOCIAL_ICONS[key.replace(/\s.*$/, '')] ?? null;
};

export default function SiteMenu({ items, projectsHref, projects, languages, socials, secondary, contactEmail, labels }: MenuData) {
  const [open, setOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  /* El HTML del servidor pinta el panel en pantalla; hasta que GSAP lo
     coloca fuera, todo el bloque va invisible para que no parpadee al cargar. */
  const [positioned, setPositioned] = useState(false);
  const openRef = useRef(false);
  const busyRef = useRef(false);

  const panelRef = useRef<HTMLElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const projectsListRef = useRef<HTMLUListElement | null>(null);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);

  const layers = useCallback(() => Array.from(preLayersRef.current?.querySelectorAll<HTMLElement>('.sm-prelayer') ?? []), []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      if (!panel) return;
      gsap.set([panel, ...layers()], { clipPath: circleAt(0), opacity: 1 });
    });
    setPositioned(true);
    return () => ctx.revert();
  }, [layers]);

  const resetItems = useCallback((panel: HTMLElement) => {
    const itemEls = panel.querySelectorAll<HTMLElement>('.sm-panel-itemLabel');
    const socialTitle = panel.querySelector<HTMLElement>('.sm-socials-title');
    const socialLinks = panel.querySelectorAll<HTMLElement>('.sm-socials-link');
    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
  }, []);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return null;
    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    closeTweenRef.current = null;

    const itemEls = Array.from(panel.querySelectorAll<HTMLElement>('.sm-panel-itemLabel'));
    const socialTitle = panel.querySelector<HTMLElement>('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll<HTMLElement>('.sm-socials-link'));
    const layerEls = layers();

    resetItems(panel);

    /* Cada capa es un círculo que crece desde la hamburguesa; el panel, el
       último y el más lento, cubre a los anteriores. */
    const closed = circleAt(0);
    const opened = circleAt(coverRadius());
    /* Las capas de color acompañan al panel desde la hamburguesa pero no
       llegan a la esquina opuesta: si lo hacían, justo antes de que el panel
       terminara de cubrir asomaba allí un pico ámbar con el borde curvo, y
       parecía un fallo. Y el círculo acelera hacia el final en vez de frenar:
       frenando, la última franja de la esquina se quedaba a la vista. */
    const layerOpened = circleAt(coverRadius() * 0.7);
    const tl = gsap.timeline({ paused: true });
    layerEls.forEach((el, i) => {
      tl.fromTo(el, { clipPath: closed }, { clipPath: layerOpened, duration: 0.6, ease: 'power2.in' }, i * 0.07);
    });
    const lastTime = layerEls.length ? (layerEls.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerEls.length ? 0.08 : 0);
    const panelDuration = 0.6;
    tl.fromTo(panel, { clipPath: closed }, { clipPath: opened, duration: panelDuration, ease: 'power2.in' }, panelInsertTime);

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.55;
      tl.to(itemEls, { yPercent: 0, rotate: 0, ...CARTOON, stagger: { each: 0.1, from: 'start' } }, itemsStart);
    }
    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.75;
      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: appleOut }, socialsStart);
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          { y: 0, opacity: 1, ...CARTOON, stagger: { each: 0.08, from: 'start' }, onComplete: () => gsap.set(socialLinks, { clearProps: 'opacity' }) },
          socialsStart + 0.04
        );
      }
    }
    openTlRef.current = tl;
    return tl;
  }, [layers, resetItems]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (!tl) {
      busyRef.current = false;
      return;
    }
    tl.eventCallback('onComplete', () => {
      busyRef.current = false;
    });
    tl.play(0);
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    const panel = panelRef.current;
    if (!panel) return;
    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to([...layers(), panel], {
      clipPath: circleAt(0),
      duration: 0.4,
      ease: 'power2.out',
      stagger: { each: 0.05, from: 'end' },
      overwrite: 'auto',
      onComplete: () => {
        resetItems(panel);
        busyRef.current = false;
      }
    });
  }, [layers, resetItems]);

  const setState = useCallback(
    (next: boolean) => {
      if (openRef.current === next) return;
      openRef.current = next;
      setOpen(next);
      if (next) playOpen();
      else {
        playClose();
        setProjectsOpen(false);
      }
      /* global.css oculta con esto la navegación en página (`.page-nav`),
         que se colaba por encima del panel. */
      document.documentElement.toggleAttribute('data-site-menu-open', next);
      window.dispatchEvent(new CustomEvent('site-menu:state', { detail: { open: next } }));
      /* La hamburguesa (BurgerIcon.astro) sincroniza su icono con este evento. */
      window.dispatchEvent(new CustomEvent('menu:state', { detail: { open: next } }));
    },
    [playOpen, playClose]
  );

  useEffect(() => {
    const onResize = () => {
      if (!openRef.current || busyRef.current || !panelRef.current) return;
      gsap.set([panelRef.current, ...layers()], { clipPath: circleAt(coverRadius()) });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [layers]);

  useEffect(() => {
    const onToggle = () => setState(!openRef.current);
    window.addEventListener('site-menu:toggle', onToggle);
    return () => window.removeEventListener('site-menu:toggle', onToggle);
  }, [setState]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setState(false);
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && !(target as Element).closest?.('[aria-controls="site-menu-panel"]')) setState(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, setState]);

  /* Con el panel abierto: las redes responden en cadena y las letras de cada
     ítem saltan una tras otra desde la que toca el puntero (o todas, con el
     teclado). Las letras se parten al primer paso y se recomponen al cerrar,
     para no dejar el DOM de React troceado. El recorte vertical del
     envoltorio solo hace falta para la entrada: se quita en el ítem que salta
     y vuelve al cerrar. */
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    /* Importación dinámica: cartoon.ts arrastra main.ts (GSAP y su arranque
       de página), que no puede evaluarse al renderizar la isla en el servidor. */
    let cartoon: typeof import('../../scripts/cartoon') | null = null;
    let cancelled = false;
    import('../../scripts/cartoon').then(mod => {
      if (cancelled) return;
      cartoon = mod;
      mod.bindChain(panel.querySelector<HTMLElement>('.sm-socials-list'));
    });
    const chains = new Map<HTMLElement, { play: (from?: number | 'start' | 'center') => void; revert: () => void }>();
    const unclipped: HTMLElement[] = [];
    const chainFor = (item: HTMLElement) => {
      /* Solo el texto: SplitText reescribe el contenido al recomponer, y la
         flecha de «Proyectos» es un nodo que React sigue actualizando. */
      const label = item.querySelector<HTMLElement>('.sm-panel-itemText');
      if (!label) return null;
      let chain = chains.get(label);
      if (!chain) {
        const made = cartoon?.letterChain(label, item);
        if (!made) return null;
        chain = made;
        chains.set(label, chain);
      }
      const wrap = item.closest<HTMLElement>('.sm-panel-itemWrap');
      if (wrap && !unclipped.includes(wrap)) {
        wrap.style.clipPath = 'none';
        unclipped.push(wrap);
      }
      return chain;
    };
    const onOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || busyRef.current) return;
      const item = (event.target as Element).closest<HTMLElement>('.sm-panel-item');
      if (!item || item.contains(event.relatedTarget as Node)) return;
      const chain = chainFor(item);
      if (!chain) return;
      const chars = Array.from(item.querySelectorAll('.cartoon-char'));
      const near = chars.reduce(
        (best, c, i) => {
          const r = c.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - event.clientX);
          return d < best.d ? { i, d } : best;
        },
        { i: 0, d: Infinity }
      );
      chain.play(near.i);
    };
    const onFocus = (event: FocusEvent) => {
      const item = (event.target as Element).closest<HTMLElement>('.sm-panel-item');
      if (item?.matches(':focus-visible')) chainFor(item)?.play('start');
    };
    panel.addEventListener('pointerover', onOver);
    panel.addEventListener('focusin', onFocus);
    return () => {
      cancelled = true;
      panel.removeEventListener('pointerover', onOver);
      panel.removeEventListener('focusin', onFocus);
      chains.forEach(chain => chain.revert());
      unclipped.forEach(wrap => (wrap.style.clipPath = ''));
    };
  }, [open]);

  /* Acordeón de proyectos: mismo lenguaje que los ítems del panel, a escala. */
  const toggleProjects = useCallback(() => {
    const list = projectsListRef.current;
    const next = !projectsOpen;
    setProjectsOpen(next);
    if (!list) return;
    const labelEls = list.querySelectorAll<HTMLElement>('.sm-sub-itemLabel');
    if (next) {
      gsap.fromTo(list, { height: 0 }, { height: 'auto', duration: 0.5, ease: appleOut, clearProps: 'height' });
      gsap.fromTo(labelEls, { yPercent: 120, rotate: 6, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, ...CARTOON, stagger: { each: 0.05, from: 'start' } });
    } else {
      gsap.to(list, { height: 0, duration: 0.3, ease: apple });
    }
  }, [projectsOpen]);

  const isProjects = (href: string) => href.replace(/\/$/, '') === projectsHref.replace(/\/$/, '');

  /* 1,15 y no leading-none: la tinta de Aristotelica ocupa 1,10 em de alto
     (ver las métricas del @font-face) y el envoltorio de la animación de
     revelado recorta lo que sobresalga; así las tildes y las colas respiran. */
  const itemClass =
    'sm-panel-item relative inline-block cursor-pointer font-display text-[clamp(2rem,6.5vw,3.6rem)] font-[800] leading-[1.15] tracking-[-0.02em] text-[var(--bg-white)] no-underline transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current';

  /* Cerrado, el panel sigue en el DOM con sus enlaces: `inert` los saca del
     orden de tabulación y del árbol de accesibilidad (un `aria-hidden` con
     descendientes enfocables es un fallo de accesibilidad en Lighthouse y una
     trampa de foco real para quien navega con teclado). */
  return (
    <div className={`sm-scope pointer-events-none fixed inset-0 z-[45] overflow-hidden ${positioned ? '' : 'invisible'}`} data-open={open || undefined} aria-hidden={!open} inert={!open || undefined}>
      <div ref={preLayersRef} className="sm-prelayers pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
        {['var(--secondary)', 'var(--accent)'].map((c, i) => (
          <div key={i} className="sm-prelayer absolute inset-0" style={{ background: c }} />
        ))}
      </div>

      <aside
        id="site-menu-panel"
        ref={panelRef}
        className="sm-panel pointer-events-auto absolute right-0 top-0 z-10 flex h-full w-full flex-col overflow-y-auto bg-primary px-[clamp(1.5rem,4vw,3rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(90px+clamp(1.5rem,4vh,3rem))] text-[var(--bg-white)]"
        aria-label={labels.navigation}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
          <ul className="sm-panel-list m-0 flex list-none flex-col gap-2 p-0" role="list">
            {/* El envoltorio recorta solo en vertical: el revelado necesita tapar
                el texto por arriba y por abajo, pero la J de Aristotelica saca el
                gancho 0,09 em a la izquierda del origen y un overflow oculto se lo
                comía (Join us). */}
            {items.map((it, idx) => (
              <li className="sm-panel-itemWrap relative clip-reveal leading-none" key={it.href + idx}>
                {isProjects(it.href) ? (
                  <>
                    <button
                      type="button"
                      className={`${itemClass} border-0 bg-transparent p-0 text-left`}
                      aria-expanded={projectsOpen}
                      aria-controls="site-menu-projects"
                      onClick={toggleProjects}
                    >
                      <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                        <span className="sm-panel-itemText">{it.label}</span>
                        <svg aria-hidden="true" width="0.55em" height="0.55em" viewBox="0 0 10 10" className={`ml-3 inline-block align-middle spring ${projectsOpen ? 'rotate-180' : ''}`}>
                          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                    {/* El aire sobre la lista va dentro (padding del primer li):
                        así lo recorta el `height: 0` y, cerrado, «Projects» mide
                        lo mismo que los demás ítems. */}
                    <ul id="site-menu-projects" ref={projectsListRef} className="m-0 flex list-none flex-col gap-1 overflow-hidden p-0 pl-[3.5rem]" style={{ height: 0 }} role="list">
                      <li className="clip-reveal pt-3">
                        <a href={projectsHref} className="sm-sub-item block py-1.5 font-display text-[1.05rem] font-bold text-[var(--bg-white)] hover:text-accent">
                          <span className="sm-sub-itemLabel inline-block">{labels.allProjects} ↗</span>
                        </a>
                      </li>
                      {projects.map(p => (
                        <li key={p.href + p.title} className="clip-reveal">
                          <a href={p.href} className="sm-sub-item block py-1.5 font-display text-[1.05rem] font-bold text-[var(--bg-white)]/75 transition-colors hover:text-accent">
                            <span className="sm-sub-itemLabel inline-block">{p.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <a className={`${itemClass} ${it.current ? 'opacity-50' : ''}`} href={it.href} aria-current={it.current ? 'page' : undefined}>
                    <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                      <span className="sm-panel-itemText">{it.label}</span>
                    </span>
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Pie del panel: redes con icono, idiomas, transparencia y correo. */}
          <div className="sm-socials mt-auto flex flex-col gap-5 border-t border-white/15 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              <ul className="sm-socials-list m-0 flex list-none items-center gap-3 p-0" role="list" aria-label={labels.socials}>
                {socials.map((s, i) => (
                  <li key={s.href + i}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="sm-socials-link inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-[var(--bg-white)] spring press hover:-translate-y-0.5 hover:bg-accent hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {socialIcon(s.label) ?? <span className="text-[0.7rem] font-bold uppercase">{s.label.slice(0, 2)}</span>}
                    </a>
                  </li>
                ))}
              </ul>
              <ul className="m-0 flex list-none items-center gap-1 p-0" aria-label={labels.changeLanguage} role="list">
                {languages.map(l => (
                  <li key={l.code}>
                    {l.current ? (
                      <span aria-current="true" className="sm-socials-link inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[var(--bg-white)] px-3 font-display text-[0.78rem] font-bold uppercase tracking-[0.16em] text-primary">
                        {l.short}
                      </span>
                    ) : (
                      <a
                        href={l.href}
                        hrefLang={l.code}
                        lang={l.code}
                        aria-label={l.label}
                        className="sm-socials-link inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 font-display text-[0.78rem] font-bold uppercase tracking-[0.16em] text-[var(--bg-white)]/70 no-underline transition-colors hover:bg-white/10 hover:text-[var(--bg-white)]"
                      >
                        {l.short}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              {secondary.map(s => (
                <a key={s.href} href={s.href} className="sm-socials-link font-display text-[0.9rem] font-bold text-[var(--bg-white)]/70 underline-offset-4 transition-colors hover:text-[var(--bg-white)] hover:underline">
                  {s.label}
                </a>
              ))}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="sm-socials-link font-display text-[0.9rem] font-bold text-[var(--bg-white)]/70 underline-offset-4 transition-colors hover:text-[var(--bg-white)] hover:underline">
                  {contactEmail}
                </a>
              )}
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}
