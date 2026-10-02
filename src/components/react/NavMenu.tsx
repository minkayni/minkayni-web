/* NavMenu — la barra de escritorio, con el desplegable de Aceternity
   (ui.aceternity.com/components/navbar-menu): MenuItem + ProductItem +
   HoveredLink, misma transición de resorte y mismo `layoutId` para que el
   panel se deslice de un ítem a otro en lugar de reaparecer.

   Adaptaciones, todas de contexto y no de mecánica:
   - El original es una píldora blanca flotante; aquí el navbar ya existe y es
     transparente con tinta adaptativa, así que solo se toma el desplegable.
     Los enlaces heredan `currentColor`.
   - El panel se pinta en un portal sobre <body>. El navbar recorta con
     `overflow-hidden` para esconder su segunda barra al desplazarse, y un
     desplegable dentro de él quedaba invisible. Como el panel ya no es
     descendiente de la barra, el ratón puede salir de ella camino del panel:
     el cierre espera 140ms y se cancela al entrar en el panel.
   - Next.js `Image`/`Link` → <img>/<a>: el sitio es estático.
   - «Proyectos» abre una rejilla de ProductItems con todos los proyectos del
     CMS; el idioma abre una lista de HoveredLinks. El mismo componente sirve
     a los dos, que es lo que hace que el selector deje de parecer un añadido.
   - La cascada de entrada del navbar (antes un tween de GSAP desde y:40) pasa
     al patrón actual: cada ítem entra con un desenfoque que se resuelve y un
     resorte corto, escalonado. Espera al evento `intro:finished` del vídeo de
     portada para no adelantarse a la intro. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MotionConfig, motion, useReducedMotion } from 'motion/react';
import { APPLE_BEZIER, APPLE_OUT_BEZIER } from '../../scripts/easing';
import type { MenuLabels, MenuLanguage, MenuLink, MenuProject } from './menu-types';

/* El panel aparece con la curva de Apple, sin rebote: un menú que surge solo
   no debe pasarse de sitio. Pero al pasar de un ítem a otro el panel VIAJA
   siguiendo al cursor (layoutId), y eso es movimiento físico: resorte con un
   rebote leve (SPRINGS.snappy de scripts/spring.ts en la API de motion). */
const transition = { duration: 0.35, ease: APPLE_BEZIER };
const morph = { type: 'spring', visualDuration: 0.35, bounce: 0.2 } as const;

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: APPLE_OUT_BEZIER } }
};

interface MenuItemProps {
  setActive: (item: string | null) => void;
  active: string | null;
  item: string;
  href?: string;
  current?: boolean;
  chevron?: boolean;
  onPanelEnter?: () => void;
  onPanelLeave?: () => void;
  children?: ReactNode;
}

export const MenuItem = ({ setActive, active, item, href, current, chevron, onPanelEnter, onPanelLeave, children }: MenuItemProps) => {
  const open = active === item;
  const labelRef = useRef<HTMLElement | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelLeft, setPanelLeft] = useState<number | null>(null);

  /* Dónde cae el panel: bajo el centro del ítem. Se mide al abrir; el navbar
     es fijo, así que la posición no cambia mientras el panel está abierto. */
  useEffect(() => {
    if (!open || !labelRef.current) return;
    const rect = labelRef.current.getBoundingClientRect();
    setAnchor({ x: rect.left + rect.width / 2, y: rect.bottom });
  }, [open]);

  /* Centrado bajo el ítem, pero nunca fuera de la ventana: con el ancho real
     del panel (medido antes de pintar) se acota a un margen por cada lado. */
  useLayoutEffect(() => {
    if (!open || !anchor || !panelRef.current) {
      setPanelLeft(null);
      return;
    }
    const margin = 16;
    const width = panelRef.current.offsetWidth;
    const centered = anchor.x - width / 2;
    setPanelLeft(Math.round(Math.min(Math.max(centered, margin), Math.max(margin, window.innerWidth - margin - width))));
  }, [open, anchor]);

  const Label = href && !current ? 'a' : 'span';
  return (
    <motion.div variants={itemVariants} onMouseEnter={() => setActive(item)} onFocus={() => setActive(item)} className="relative">
      <Label
        ref={labelRef as never}
        href={href && !current ? href : undefined}
        aria-current={current ? 'page' : undefined}
        aria-haspopup={children ? 'true' : undefined}
        aria-expanded={children ? open : undefined}
        role={children && !href ? 'button' : undefined}
        tabIndex={children && !href ? 0 : undefined}
        onClick={event => {
          /* Sin hover (táctil), un ítem que solo abre un panel se abre al pulsarlo. */
          if (children && !href) {
            event.preventDefault();
            setActive(open ? null : item);
          }
        }}
        onKeyDown={event => {
          if (children && !href && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setActive(open ? null : item);
          }
        }}
        className={`group relative inline-flex cursor-pointer items-center gap-1.5 py-2 text-current no-underline focus:outline-none ${current ? 'pointer-events-none opacity-60' : ''}`}
      >
        <span className="relative">
          {item}
          {!current && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left rounded-full bg-current"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: open ? 1 : 0 }}
              transition={{ duration: 0.3, ease: APPLE_OUT_BEZIER }}
            />
          )}
        </span>
        {chevron && (
          <motion.svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" className="mt-px opacity-70" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: APPLE_BEZIER }}>
            <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        )}
      </Label>

      {children && open && anchor && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              data-nav-menu-panel
              className="fixed z-[60] pt-3"
              style={{ left: panelLeft ?? 0, top: anchor.y + 6, visibility: panelLeft === null ? 'hidden' : undefined }}
              onMouseEnter={onPanelEnter}
              onMouseLeave={onPanelLeave}
            >
              <motion.div initial={{ opacity: 0, scale: 0.85, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={transition} style={{ transformOrigin: 'top center' }}>
                <motion.div
                  transition={morph}
                  layoutId="nav-menu-active"
                  /* Sigue desplazándose si no cabe, pero sin barra visible: con
                     el cambio de tamaño entre paneles (`layout`) asomaba un
                     instante. */
                  className="max-h-[calc(100svh-7rem)] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-[1.75rem] border border-black/10 bg-[var(--bg-white)] text-black shadow-[0_24px_60px_rgba(35,15,55,0.22)] backdrop-blur-sm"
                >
                  <motion.div layout transition={morph} className="h-full w-max p-4">
                    {children}
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>,
            document.body
          )
        : null}
    </motion.div>
  );
};

const ProductItem = ({ title, description, href, src, alt }: MenuProject) =>
  src ? (
    /* Destacado: imagen encima del texto, a todo el ancho de su columna. En
       paralelo (como el original, pensado para descripciones de una línea) el
       texto quedaba en 140px y el resumen se partía en siete líneas. */
    <a href={href} className="group/item block rounded-2xl p-2 transition-colors hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none">
      <img src={src} width={240} height={135} alt={alt ?? ''} loading="lazy" decoding="async" className="mb-2.5 aspect-[16/9] w-full rounded-xl object-cover shadow-md" />
      <span className="mb-0.5 block font-display text-[1.05rem] font-bold leading-snug text-black transition-colors group-hover/item:text-primary">{title}</span>
      <span className="line-clamp-3 text-[0.82rem] leading-snug text-black/65">{description}</span>
    </a>
  ) : (
    <a href={href} className="group/item flex flex-col gap-0.5 rounded-2xl px-3 py-2 transition-colors hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none">
      <span className="block font-display text-[0.95rem] font-bold leading-snug text-black transition-colors group-hover/item:text-primary">{title}</span>
      <span className="line-clamp-1 text-[0.78rem] leading-snug text-black/60">{description}</span>
    </a>
  );

export const HoveredLink = ({ label, href, current }: MenuLanguage | (MenuLink & { current?: boolean })) =>
  current ? (
    <span aria-current="true" className="flex items-center gap-2 rounded-xl px-3 py-2 font-display text-[0.95rem] font-bold text-primary">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
      {label}
    </span>
  ) : (
    <a href={href} className="flex items-center gap-2 rounded-xl px-3 py-2 font-display text-[0.95rem] font-bold text-black/70 transition-colors hover:bg-primary/5 hover:text-black focus-visible:bg-primary/5 focus-visible:outline-none">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-transparent" />
      {label}
    </a>
  );

export interface NavMenuProps {
  items: MenuLink[];
  projectsHref: string;
  projects: MenuProject[];
  languages: MenuLanguage[];
  labels: MenuLabels;
  /** La página trae la intro de la portada: los ítems esperan ocultos y entran en cascada al terminar. */
  intro?: boolean;
}

export default function NavMenu({ items, projectsHref, projects, languages, labels, intro = false }: NavMenuProps) {
  const [active, setActive] = useState<string | null>(null);
  /* Sin intro, visible ya en el HTML que sale del servidor: la barra se
     pinta con el primer cuadro y la hidratación no tiene nada que revelar. */
  const [ready, setReady] = useState(!intro);
  const reduced = useReducedMotion();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActive(null), 140);
  }, [cancelClose]);
  const activate = useCallback(
    (item: string | null) => {
      cancelClose();
      setActive(item);
    },
    [cancelClose]
  );

  /* La intro de portada oculta el sitio hasta que acaba el vídeo y avisa con
     `intro:finished`; en las demás páginas el aviso llega nada más cargar.
     Si la isla hidrata cuando ya pasó, el estado del documento lo dice. */
  useEffect(() => {
    if (!intro) return;
    const done = () => setReady(true);
    const introRunning = document.getElementById('intro-overlay') || document.documentElement.classList.contains('no-scroll') || document.body.hasAttribute('data-intro');
    if (!introRunning) {
      done();
      return;
    }
    /* `nav:reveal` llega cuando arranca la cascada del reloj y el CTA;
       `intro:finished`, al acabar la intro, queda de respaldo. */
    window.addEventListener('nav:reveal', done, { once: true });
    window.addEventListener('intro:finished', done, { once: true });
    return () => {
      window.removeEventListener('nav:reveal', done);
      window.removeEventListener('intro:finished', done);
    };
  }, [intro]);

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
    };
    /* Al desplazarse, la barra se va: el panel no debe quedarse flotando. */
    const onScroll = () => setActive(null);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [active]);

  const projectsMatch = (href: string) => href.replace(/\/$/, '') === projectsHref.replace(/\/$/, '');
  const current = languages.find(l => l.current);
  const projectsWithImage = projects.filter(p => p.src);
  const projectsText = projects.filter(p => !p.src);

  return (
    /* Con movimiento reducido motion deja los cambios de opacidad y anula
       los de posición, tamaño y escala (incluido el resorte del panel). */
    <MotionConfig reducedMotion="user">
      <motion.nav
        aria-label={labels.navigation}
        /* Invisible durante la intro, pero no debe recibir el puntero: el hover
           abría el megamenú sobre una barra que aún no se veía. */
        style={{ pointerEvents: ready || reduced ? undefined : 'none' }}
        variants={reduced ? undefined : listVariants}
        initial={reduced ? false : 'hidden'}
        animate={reduced ? undefined : ready ? 'visible' : 'hidden'}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onBlur={event => {
          const next = event.relatedTarget as Element | null;
          if (!event.currentTarget.contains(next) && !next?.closest?.('[data-nav-menu-panel]')) setActive(null);
        }}
        className="flex shrink-0 items-center gap-8 whitespace-nowrap"
      >
        {items.map(link =>
          projectsMatch(link.href) ? (
            <MenuItem key={link.href} setActive={activate} active={active} item={link.label} href={link.href} current={link.current} chevron onPanelEnter={cancelClose} onPanelLeave={scheduleClose}>
              <div className="flex w-[46rem] max-w-[calc(100vw-3rem)] gap-5">
                {projectsWithImage.length > 0 && (
                  <div className="flex w-[15rem] shrink-0 flex-col gap-1 border-r border-black/10 pr-5">
                    {projectsWithImage.map(project => (
                      <ProductItem key={project.href + project.title} {...project} />
                    ))}
                  </div>
                )}
                <div className="grid flex-1 grid-cols-2 content-start gap-x-3 gap-y-0.5">
                  {projectsText.map(project => (
                    <ProductItem key={project.href + project.title} {...project} />
                  ))}
                </div>
              </div>
              <a
                href={projectsHref}
                className="mt-3 flex items-center justify-between rounded-2xl bg-primary/5 px-4 py-3 font-display text-[0.92rem] font-bold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {labels.allProjects}
                <span aria-hidden="true">↗</span>
              </a>
            </MenuItem>
          ) : (
            <MenuItem key={link.href} setActive={activate} active={active} item={link.label} href={link.href} current={link.current} />
          )
        )}

        {current && (
          <MenuItem setActive={activate} active={active} item={current.short} chevron onPanelEnter={cancelClose} onPanelLeave={scheduleClose}>
            <div className="flex min-w-[10.5rem] flex-col">
              <span className="px-3 pb-1 pt-1 text-[0.64rem] font-bold uppercase tracking-[0.22em] text-black/45">{labels.language}</span>
              {languages.map(lang => (
                <HoveredLink key={lang.code} {...lang} />
              ))}
            </div>
          </MenuItem>
        )}
      </motion.nav>
    </MotionConfig>
  );
}
