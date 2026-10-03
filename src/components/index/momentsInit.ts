import { gsap, Draggable, InertiaPlugin } from "../../scripts/main";
import { BOUNCY, CARTOON, SMOOTH, springTween } from "../../scripts/spring";
import { isMobileViewport, prefersReducedMotion } from "../../scripts/platform";
import { onWidthResize } from "../../scripts/viewport";

export const init = () => {
    const wrapperEl = document.querySelector<HTMLDivElement>(".wrapper");
    if (!wrapperEl) {
        throw new Error('No se encontró el elemento con selector ".wrapper".');
    }

    const MARGIN_RIGHT_PX = 40;

    const boxes = gsap.utils.toArray<HTMLElement>(wrapperEl.querySelectorAll(".post-card"));
    if (boxes.length === 0) {
        return;
    }

    gsap.set(boxes[boxes.length - 1], { marginRight: `${MARGIN_RIGHT_PX}px` });

    // Loop horizontal (pausado y arrastrable)
    // Builder para poder reconstruir el loop en resize; usamos paddingRight fijo (MARGIN_RIGHT_PX)
    let activeEl: HTMLElement | null = null;
    /* Se asigna más abajo, cuando existe el planificador de vídeos. */
    let reordenarVideos: () => void = () => {};
    const buildLoop = (): HorizontalLoopTimeline => {
        return horizontalLoop(boxes, {
            paused: true,
            draggable: true,
            paddingRight: MARGIN_RIGHT_PX,
            repeat: -1,
            center: true,
            onChange: (el: HTMLElement) => {
                if (activeEl) activeEl.classList.remove("active");
                el.classList.add("active");
                activeEl = el;
                reordenarVideos();
            },
        });
    };

    let loop: HorizontalLoopTimeline = buildLoop();
    /* Mientras caen las tarjetas de la entrada (más abajo), la cinta espera. */
    let cascading = false;
    /* Con menos movimiento la cinta no avanza sola; arrastre y clic siguen. */
    const playLoop = () => {
        if (!prefersReducedMotion() && !cascading) loop.play();
    };

    /* ── Entrada en cascada ──────────────────────────────────────────────
       La primera vez que la cinta entra en pantalla, las tarjetas visibles
       caen desde arriba una tras otra, de izquierda a derecha, giradas como
       cartas lanzadas; al tocar su sitio rebotan (resorte de caricatura) y se
       aplastan un instante contra el suelo. La foto de dentro se asienta con
       un zoom sin rebote (llena su marco) y, al final, la cinta arranca
       acelerando desde parada en vez de moverse de golpe.
       Solo `yPercent`, `rotation` y `scaleY`: el bucle mide con `xPercent` y
       `scaleX`, que no se tocan. Sin JS, con movimiento reducido o si la
       cinta ya se ve al cargar, no se oculta nada. */
    const cascade = !prefersReducedMotion() && wrapperEl.getBoundingClientRect().top > window.innerHeight;
    let entered = !cascade;
    if (cascade) gsap.set(boxes, { yPercent: -80, opacity: 0, rotation: (i: number) => (i % 2 ? 1 : -1) * (8 + (i % 3) * 3), transformOrigin: "50% 100%" });

    const showAll = () => gsap.set(boxes, { yPercent: 0, opacity: 1, rotation: 0, scaleY: 1 });

    const runCascade = () => {
        entered = true;
        cascading = true;
        const vw = window.innerWidth;
        const ordered = [...boxes].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        const onScreen = ordered.filter((b) => {
            const r = b.getBoundingClientRect();
            return r.right > 0 && r.left < vw;
        });
        gsap.set(ordered.filter((b) => !onScreen.includes(b)), { yPercent: 0, opacity: 1, rotation: 0 });

        const STEP = 0.09;
        const tl = gsap.timeline();
        onScreen.forEach((card, i) => {
            const at = i * STEP;
            tl.to(card, { yPercent: 0, rotation: 0, ...CARTOON }, at)
                .to(card, { opacity: 1, duration: 0.2, ease: "none" }, at)
                /* Primer contacto con el suelo, hacia el 18 % del resorte. */
                .fromTo(card, { scaleY: 0.86 }, { scaleY: 1, ...BOUNCY, immediateRender: false }, at + CARTOON.duration * 0.18);
            const media = card.querySelector(".media");
            if (media) tl.fromTo(media, { scale: 1.3 }, { scale: 1, ...SMOOTH, clearProps: "transform" }, at);
        });

        /* La cinta arranca cuando cae la última, acelerando desde cero. */
        tl.add(() => {
            cascading = false;
            if (!isInView || document.hidden || prefersReducedMotion()) return;
            loop.timeScale(0);
            playLoop();
            gsap.to(loop, { timeScale: 1, duration: 1.4, ease: "sine.inOut" });
        }, onScreen.length * STEP + 0.35);

        /* Red de seguridad: si el reloj de GSAP no avanzara, nada se queda oculto. */
        window.setTimeout(() => {
            if (tl.progress() < 1) {
                cascading = false;
                showAll();
            }
        }, 5000);
    };

    // Control por viewport: pausa/reanuda al entrar/salir
    let isInView = false;
    const onEnterView = () => {
        isInView = true;
        if (!entered) runCascade();
        else playLoop();
        reordenarVideos();
    };
    const onExitView = () => {
        isInView = false;
        loop.pause();
        reordenarVideos();
    };
    const io = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? onEnterView() : onExitView())), { threshold: 0.2 });
    io.observe(wrapperEl);

    /* ── Vídeos: cuántos y cuáles se reproducen ─────────────────────────

       Antes se reproducía todo reel que asomara en pantalla. Con la cinta en
       movimiento eso eran tres, cuatro o cinco vídeos decodificándose a la vez
       mientras las tarjetas se desplazaban, y de ahí los tirones.

       Ahora hay un tope, y se lo llevan los más cercanos al centro, que es
       donde se mira:
       - 2 a la vez en pantallas anchas, 1 en un teléfono (donde apenas caben
         dos tarjetas);
       - 0 si se pidió menos movimiento, si el navegador pide ahorrar datos o
         si el equipo es de los lentos (`data-low-power`): se ven las portadas.
       El resto muestra su portada, o el último fotograma si ya sonó.

       Y un vídeo que sale de pantalla, pasados unos segundos, suelta el
       archivo: deja de ocupar decodificador y memoria. Si vuelve, se recarga
       (normalmente de la caché del navegador). */
    /* Sin soporte del formato (WebM en Safari de iPhone antiguo) el vídeo ni
       entra en el reparto: se queda su portada, que ya es un estado final. */
    const videos = Array.from(wrapperEl.querySelectorAll<HTMLVideoElement>("video[data-src]")).filter((video) => {
        const tipo = video.dataset.type;
        return !tipo || video.canPlayType(tipo) !== "";
    });
    const visibles = new Set<HTMLVideoElement>();
    const reproduciendo = new Set<HTMLVideoElement>();
    const liberar = new Map<HTMLVideoElement, number>();
    const LIBERAR_TRAS_MS = 4000;

    const ahorro = (): boolean => {
        const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
        return (
            prefersReducedMotion() ||
            conexion?.saveData === true ||
            document.documentElement.hasAttribute("data-low-power")
        );
    };
    const tope = (): number => (ahorro() ? 0 : isMobileViewport() ? 1 : 2);

    const reproducir = (video: HTMLVideoElement) => {
        const src = video.dataset.src;
        if (!src) return;
        const pendiente = liberar.get(video);
        if (pendiente) {
            window.clearTimeout(pendiente);
            liberar.delete(video);
        }
        if (!video.getAttribute("src")) {
            video.src = src;
            video.load();
        }
        video.muted = true;
        reproduciendo.add(video);
        void video.play().catch(() => {});
    };

    const pausar = (video: HTMLVideoElement) => {
        reproduciendo.delete(video);
        try {
            video.pause();
        } catch {}
    };

    /* Soltar el archivo devuelve el elemento a su portada y libera el
       decodificador; `load()` sin `src` es la forma estándar de hacerlo. */
    const soltar = (video: HTMLVideoElement) => {
        liberar.delete(video);
        if (visibles.has(video) || !video.getAttribute("src")) return;
        pausar(video);
        video.removeAttribute("src");
        video.load();
    };

    reordenarVideos = () => {
        if (document.hidden || !isInView) {
            reproduciendo.forEach(pausar);
            return;
        }
        const max = tope();
        const caja = wrapperEl.getBoundingClientRect();
        const centro = caja.left + caja.width / 2;
        const elegidos = new Set(
            [...visibles]
                .map((video) => {
                    const r = video.getBoundingClientRect();
                    return { video, distancia: Math.abs(r.left + r.width / 2 - centro) };
                })
                .sort((a, b) => a.distancia - b.distancia)
                .slice(0, max)
                .map(({ video }) => video)
        );
        [...reproduciendo].forEach((video) => {
            if (!elegidos.has(video)) pausar(video);
        });
        elegidos.forEach((video) => {
            if (!reproduciendo.has(video) || video.paused) reproducir(video);
        });
    };

    const videoObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const video = entry.target as HTMLVideoElement;
                if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
                    visibles.add(video);
                    const pendiente = liberar.get(video);
                    if (pendiente) {
                        window.clearTimeout(pendiente);
                        liberar.delete(video);
                    }
                    return;
                }
                visibles.delete(video);
                pausar(video);
                if (!entry.isIntersecting && video.getAttribute("src") && !liberar.has(video)) {
                    liberar.set(video, window.setTimeout(() => soltar(video), LIBERAR_TRAS_MS));
                }
            });
            reordenarVideos();
        },
        { threshold: [0, 0.35, 1] }
    );
    videos.forEach((video) => videoObserver.observe(video));

    /* Si aun así no se puede reproducir, se retira del reparto y vuelve a su
       portada; el hueco lo toma el siguiente vídeo más cercano al centro. */
    const onVideoError = (event: Event) => {
        const video = event.currentTarget as HTMLVideoElement;
        videoObserver.unobserve(video);
        visibles.delete(video);
        pausar(video);
        delete video.dataset.src;
        video.removeAttribute("src");
        video.load();
        reordenarVideos();
    };
    videos.forEach((video) => video.addEventListener("error", onVideoError, { once: true }));

    // Pausar el carousel al hacer hover (pointer enter) y restaurar al salir.
    // Guardamos si estaba reproduciéndose para restaurar correctamente.
    let wasPlayingOnHover = false;
    const onHoverEnter = () => {
        if (!loop) return;
        wasPlayingOnHover = !loop.paused();
        loop.pause();
    };
    const onHoverLeave = () => {
        if (!loop) return;
        if (wasPlayingOnHover && isInView && !document.hidden) playLoop();
    };
    wrapperEl.addEventListener("pointerenter", onHoverEnter);
    wrapperEl.addEventListener("pointerleave", onHoverLeave);

    // Click en cada caja: centrar ese box (toIndex directo)
    boxes.forEach((box, i) => box.addEventListener("click", () => loop.toIndex(i, springTween("snappy"))));

    /* Solo un cambio de ancho reconstruye la cinta: la barra de direcciones
       del móvil también dispara `resize` y devolvía el carrusel al inicio. */
    onWidthResize(() => {
        loop.draggable?.kill();
        loop.kill?.();
        loop = buildLoop();
        if (!document.hidden && isInView) playLoop();
    });

    // Pausar cuando la pestaña no está visible
    const onVisibility = () => {
        if (document.hidden) loop.pause();
        else if (isInView) playLoop();
        reordenarVideos();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /** ================== Tipos auxiliares ================== */

    interface HorizontalLoopConfig {
        paused?: boolean;
        repeat?: number;
        draggable?: boolean;
        speed?: number; // 1 => ~100px/s
        reversed?: boolean;
        paddingRight?: number | string;
        // false => sin snap; number => incremento; function => función de snap personalizada
        snap?: false | number | ((v: number) => number);
        center?: boolean;
        onChange?: (el: HTMLElement, index: number) => void;
    }

    type HorizontalLoopTimeline = gsap.core.Timeline & {
        next: (vars?: gsap.TweenVars) => gsap.core.Tween | undefined;
        previous: (vars?: gsap.TweenVars) => gsap.core.Tween | undefined;
        toIndex: (index: number, vars?: gsap.TweenVars) => gsap.core.Tween;
        current: () => number;
        updateIndex: () => number;
        times: number[];
        draggable?: Draggable;
    };

    /* ================== Core: horizontalLoop ================== */
    /*
    Anima un grupo de elementos a lo largo del eje X en un loop fluido y responsivo.
    Devuelve un Timeline con helpers: next, previous, toIndex, current y times.
    */
    function horizontalLoop(itemsInput: gsap.DOMTarget, config: HorizontalLoopConfig = {}): HorizontalLoopTimeline {
        const items = gsap.utils.toArray<HTMLElement>(itemsInput);
        if (items.length === 0) {
            console.error("horizontalLoop: no hay elementos que animar.");
        }

        const tl = gsap.timeline({
            repeat: config.repeat ?? 0,
            paused: !!config.paused,
            defaults: { ease: "none" },
            onReverseComplete: () => {
                tl.totalTime(tl.rawTime() + tl.duration() * 100);
            },
        }) as gsap.core.Timeline;

        const length = items.length;
        const startX = items[0].offsetLeft;

        const times: number[] = [];
        const widths: number[] = [];
        const xPercents: number[] = [];
        let curIndex = 0;
        let indexIsDirty = false;
        const pixelsPerSecond = (config.speed ?? 1) * 100;
        const onChange = config.onChange;

        // Definición de "snap"
        let snapFn: (v: number) => number;
        if (config.snap === false) {
            snapFn = (v) => v;
        } else if (typeof config.snap === "function") {
            snapFn = config.snap;
        } else {
            snapFn = gsap.utils.snap(config.snap ?? 1);
        }

        const populateWidths = (): void => {
            items.forEach((el, i) => {
                const w = Number(gsap.getProperty(el, "width", "px"));
                widths[i] = Number.isFinite(w) ? w : el.getBoundingClientRect().width;
                const xPx = Number(gsap.getProperty(el, "x", "px"));
                const xPct = Number(gsap.getProperty(el, "xPercent"));
                xPercents[i] = snapFn((xPx / widths[i]) * 100 + xPct);
            });
        };

        let spaceBefore0 = 0; // distancia desde el borde izquierdo del contenedor al inicio del primer ítem (gap/padding)

        const getTotalWidth = (): number => {
            const last = items[length - 1];
            const padRight = typeof config.paddingRight === "string" ? parseFloat(config.paddingRight) : config.paddingRight ?? 0;

            const lastScaleX = Number(gsap.getProperty(last, "scaleX")) || 1;

            return last.offsetLeft + (xPercents[length - 1] / 100) * widths[length - 1] - startX + last.offsetWidth * lastScaleX + padRight + spaceBefore0;
        };

        populateWidths();
        gsap.set(items, { xPercent: (i: number) => xPercents[i] });
        gsap.set(items, { x: 0 });

        // calcular espacio inicial antes del primer ítem
        {
            const containerRect = (items[0].parentElement as HTMLElement).getBoundingClientRect();
            const firstRect = items[0].getBoundingClientRect();
            spaceBefore0 = firstRect.left - containerRect.left;
        }

        let totalWidth = getTotalWidth();

        for (let i = 0; i < length; i++) {
            const item = items[i];
            const scaleX = Number(gsap.getProperty(item, "scaleX")) || 1;

            const curX = (xPercents[i] / 100) * widths[i];
            const distanceToStart = item.offsetLeft + curX - startX + spaceBefore0;
            const distanceToLoop = distanceToStart + widths[i] * scaleX;

            tl.to(
                item,
                {
                    xPercent: snapFn(((curX - distanceToLoop) / widths[i]) * 100),
                    duration: distanceToLoop / pixelsPerSecond,
                },
                0
            )
                .fromTo(
                    item,
                    {
                        xPercent: snapFn(((curX - distanceToLoop + totalWidth) / widths[i]) * 100),
                    },
                    {
                        xPercent: xPercents[i],
                        duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
                        immediateRender: false,
                    },
                    distanceToLoop / pixelsPerSecond
                )
                .add(`label${i}`, distanceToStart / pixelsPerSecond);

            times[i] = distanceToStart / pixelsPerSecond;
        }

        const timeWrap = gsap.utils.wrap(0, tl.duration()) as (v: number) => number;

        // Si center está activo, ajusta los tiempos para alinear el centro del item con el centro del contenedor
        if (config.center) {
            const containerEl = (items[0].parentElement as HTMLElement) || document.body;
            const timeOffset = (tl.duration() * (containerEl.offsetWidth / 2)) / totalWidth;
            times.forEach((_t, i) => {
                const labelTime = tl.labels["label" + i] as number;
                times[i] = timeWrap(labelTime + (tl.duration() * widths[i]) / 2 / totalWidth - timeOffset);
            });
        }

        // onUpdate: avisar cuando cambie el índice activo
        if (typeof onChange === "function") {
            let lastIndex = 0;
            tl.eventCallback("onUpdate", () => {
                const i = getClosest(times, tl.time(), tl.duration());
                if (lastIndex !== i) {
                    lastIndex = i;
                    onChange(items[i], i);
                }
            });
        }

        const toIndex = (index: number, vars: gsap.TweenVars = {}): gsap.core.Tween => {
            if (Math.abs(index - curIndex) > length / 2) {
                index += index > curIndex ? -length : length; // camina por el camino más corto
            }

            const newIndex = gsap.utils.wrap(0, length, index) as number;
            let time = times[newIndex];

            if (time > tl.time() !== index > curIndex) {
                // si hay wrap del playhead, ajusta con un "modifier" de tiempo
                vars.modifiers = { time: (v: number) => timeWrap(v) };
                time += tl.duration() * (index > curIndex ? 1 : -1);
            }

            curIndex = newIndex;
            vars.overwrite = true;
            return tl.tweenTo(time, vars);
        };

        // Métodos públicos añadidos al timeline
        const ext = tl as HorizontalLoopTimeline;

        // Helpers públicos
        ext.current = () => (indexIsDirty ? getClosest(times, tl.time(), tl.duration()) : curIndex);
        ext.toIndex = (index: number, vars?: gsap.TweenVars) => toIndex(index, vars ?? {});
        ext.next = (vars?: gsap.TweenVars) => toIndex(ext.current() + 1, vars ?? {});
        ext.previous = (vars?: gsap.TweenVars) => toIndex(ext.current() - 1, vars ?? {});
        ext.updateIndex = () => (curIndex = Math.round(tl.progress() * items.length));
        ext.times = times;

        // Pre-render para rendimiento
        tl.progress(1, true).progress(0, true);

        // Soporte "reversed"
        const onRev = (tl.vars as { onReverseComplete?: () => void }).onReverseComplete;
        if (config.reversed) {
            onRev?.();
            tl.reverse();
        }

        // Utilidad: índice más cercano dado un tiempo
        function getClosest(values: number[], value: number, wrap: number) {
            let i = values.length,
                closest = 1e10,
                index = 0,
                d;
            while (i--) {
                d = Math.abs(values[i] - value);
                if (d > wrap / 2) d = wrap - d;
                if (d < closest) {
                    closest = d;
                    index = i;
                }
            }
            return index;
        }

        // Arrastrable (requiere Draggable + InertiaPlugin)
        if (config.draggable && typeof (Draggable as unknown) === "function") {
            const proxy = document.createElement("div");
            const wrap01 = gsap.utils.wrap(0, 1);
            let ratio = 0;
            let startProgress = 0;
            let draggable!: Draggable;
            let lastSnap = 0;
            let initChangeX = 0;
            let wasPlaying = false;

            const align = () => tl.progress(wrap01(startProgress + (draggable.startX - draggable.x) * ratio));

            const syncIndex = (setDirty = false) => {
                const idx = getClosest(times, tl.time(), tl.duration());
                curIndex = idx;
                indexIsDirty = setDirty;
            };

            if (typeof (InertiaPlugin as unknown) === "undefined") {
                // eslint-disable-next-line no-console
                console.warn("InertiaPlugin es necesario para inercia y snapping. https://greensock.com/club");
            }

            draggable = Draggable.create(proxy, {
                trigger: items[0].parentNode as Element,
                type: "x",
                onPressInit() {
                    const x = this.x as number;
                    gsap.killTweensOf(tl);
                    wasPlaying = !tl.paused();
                    tl.pause();
                    startProgress = tl.progress();
                    // refrescamos medidas
                    populateWidths();
                    totalWidth = getTotalWidth();
                    ratio = 1 / totalWidth;
                    initChangeX = startProgress / -ratio - x;
                    gsap.set(proxy, { x: startProgress / -ratio });
                },
                onDrag: () => {
                    align();
                },
                onThrowUpdate: () => {
                    align();
                },
                inertia: true,
                overshootTolerance: 0,
                snap(value: number) {
                    // Corregir caso de release durante throw (velocidad alta)
                    if (Math.abs(startProgress / -ratio - this.x) < 10) {
                        return lastSnap + initChangeX;
                    }
                    const time = -(value * ratio) * tl.duration();
                    const wrappedTime = timeWrap(time);
                    const snapTime = times[getClosest(times, wrappedTime, tl.duration())];
                    let dif = snapTime - wrappedTime;
                    if (Math.abs(dif) > tl.duration() / 2) {
                        dif += dif < 0 ? tl.duration() : -tl.duration();
                    }
                    lastSnap = (time + dif) / tl.duration() / -ratio;
                    return lastSnap;
                },
                onRelease: () => {
                    syncIndex(true);
                },
                onThrowComplete: () => {
                    gsap.set(proxy, { x: 0 });
                    syncIndex();
                    if (wasPlaying && !document.hidden) tl.play();
                },
            })[0];

            ext.draggable = draggable;
        }

        return ext;
    }
};
