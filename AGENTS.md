# AGENTS.md

## Objetivo del repositorio

Este repositorio contiene el sitio público de Fundación Minkayni. Es un sitio Astro estático con contenido remoto de Strapi, componentes interactivos puntuales en React y animaciones con GSAP. Toda contribución debe proteger la identidad visual existente, la legibilidad y la estabilidad del contenido aun cuando JavaScript o una animación fallen.

## Stack y comandos

- Node.js: versión 18 a 22.
- Gestor: `pnpm` (respetar `pnpm-lock.yaml`; no generar otros lockfiles).
- Desarrollo: `pnpm run dev`.
- Validación de tipos/Astro: `pnpm exec astro check`.
- Build: `pnpm run build`.
- Preview de producción: `pnpm run preview`.

El arranque y el build requieren `STRAPI_URL` y `STRAPI_TOKEN` válidos en `.env`. Nunca imprimir, copiar ni versionar el token.

## Arquitectura

- `src/pages/`: rutas Astro. Actualmente `/`, `/about`, `/impact` y `/projects`.
- `src/layouts/`: estructura global, metadatos, navegación, pie y contenedores de scroll.
- `src/components/`: componentes Astro; usar React solamente cuando la interacción necesite estado en cliente.
- `src/components/index/`: secciones exclusivas de la portada.
- `src/components/projects/`: experiencia de exploración y filtrado de proyectos.
- `src/scripts/`: animaciones e interacción. Importar GSAP desde `src/scripts/main.ts` para reutilizar plugins registrados.
- `src/content/`, `src/schemas/` y `src/utils/loaders/`: integración Strapi/GraphQL y validación Zod.
- `src/styles/global.css`: tokens, tipografías locales, reset y utilidades globales.
- `src/assets/`: recursos procesados por `astro:assets`; `public/` solo para archivos servidos sin procesar.

## Reglas de implementación

- No eliminar componentes, prototipos, assets ni rutas existentes sin aprobación explícita del usuario. Si algo parece redundante, optimizarlo o desacoplarlo conservando su archivo y su API pública.
- No cambiar visualmente secciones o componentes ya aprobados: preservar composición, proporciones, colores, tipografías, texturas y movimiento. Las secciones realmente faltantes sí pueden diseñarse, siempre dentro del sistema visual existente.
- Mantener la paleta y el lenguaje visual: morado `--primary`, celeste `--secondary`, ámbar `--accent`, fondo crema `--bg-white`, tipografía Aristotelica y formas redondeadas/orgánicas.
- Reutilizar `PageLayout.astro` en páginas interiores y `MainLayout.astro` en la portada.
- No renombrar `#smooth-wrapper`, `#smooth-content`, `#intro-overlay`, `#grain-layer` ni `#tagReveal` sin actualizar todos sus consumidores.
- El contenido debe ser visible en el HTML inicial. Las animaciones son mejora progresiva: nunca dejar secciones con `opacity: 0`, `visibility: hidden` o `display: none` dependiendo de que GSAP termine correctamente. Si una animación necesita partir de un estado oculto, la regla cuelga de `html[data-js]` (o `html[data-intro="pending"]` en la portada), que escribe `src/layouts/lib/head.astro` antes del primer pintado, y lleva una animación CSS de seguridad que restaura la visibilidad pasados unos segundos.
- Cada página enlaza a la de aportes (`/donate`) y al contacto (`/about#contacto`); `tests/ad-grants.test.ts` lo comprueba sobre la build junto con el resto de requisitos de Google Ad Grants (ver README).
- Respetar `prefers-reduced-motion` y dejar siempre un estado final usable.
- Movimiento físico (basado en *Designing Fluid Interfaces*, WWDC 2018). Lo que el usuario toca o mueve usa resortes de `src/scripts/spring.ts`, no curvas fijas:
  - Hover que desplaza o escala: utilidad `spring` en vez de `transition` (sin `duration-*`). Botones y enlaces-pastilla: `spring press`.
  - Gestos (arrastrar, deslizar, lanzar): el elemento sigue al dedo 1:1 (`VelocityTracker`) y al soltar decide con `project()` y hereda la velocidad (`springTween(…, { velocity, distance })` o `Spring.to(…, { velocity })`). En los bordes, `rubberband()`, nunca un tope seco.
  - Rebote solo si lo justifica un gesto (pulsar, soltar, lanzar) o un hover. Menús, paneles y reveals que aparecen solos entran sin pasarse (curvas de Apple o `SPRINGS.smooth`). Nunca rebote en opacidad ni en color.
  - Las curvas CSS `--ease-spring-*` y sus `--spring-*-duration` se generan con `pnpm exec tsx tools/springs.ts`; `tests/spring.test.ts` falla si se desincronizan de `SPRINGS`.
- Evitar `w-screen` en contenedores internos cuando pueda causar desbordamiento; preferir `w-full`, anchos máximos y padding responsivo.
- Usar enlaces reales con `href`, estados de foco visibles, texto alternativo descriptivo y botones con etiquetas accesibles.
- No introducir texto provisional (`Lorem ipsum`, `TODO`, `#` como destino) en interfaces terminadas.
- Evitar cifras o reconocimientos no confirmados. Si no existe fuente en el repositorio, usar lenguaje cualitativo y verificable.

## Rendimiento

- Priorizar Astro sin hidratación. Añadir `client:*` solo a islas interactivas indispensables.
- Usar `astro:assets` para imágenes locales, `loading="lazy"` bajo el primer viewport y dimensiones/relaciones de aspecto estables.
- No cargar fuentes externas si existe equivalente local.
- No duplicar listeners, intervalos ni instancias de ScrollTrigger. Cada componente animado debe tener guard de inicialización y limpieza cuando corresponda.
- Mantener efectos visuales costosos acotados; no aplicar `will-change` de forma permanente a grandes superficies si no están animándose.

## Contenido y estilo de código

- UI y contenido público en español correcto.
- TypeScript estricto; evitar `any` nuevo salvo frontera externa documentada.
- Componentes con una responsabilidad clara y datos repetidos modelados como arreglos.
- Nombres de propiedades correctos en inglés (`title`, no `tittle`) al crear APIs nuevas; conservar compatibilidad solo si un componente antiguo todavía lo necesita.
- Comentarios solo para decisiones no obvias; eliminar comentarios históricos y bloques comentados que ya no aporten.

## Validación antes de entregar

1. Ejecutar `pnpm exec astro check` y corregir errores introducidos.
2. Ejecutar `pnpm run build` y verificar las cuatro rutas generadas; después `pnpm test`, que audita `dist/` contra la política de sitios de Ad Grants.
3. Ejecutar `pnpm run dev` y revisar `/`, `/about`, `/impact` y `/projects`.
4. En cada ruta comprobar navegación, hero, secciones, enlaces, footer, consola y ausencia de scroll horizontal.
5. Revisar al menos un viewport de escritorio y uno móvil, además de `prefers-reduced-motion` cuando haya animaciones nuevas.

## Seguridad del trabajo local

El repositorio puede contener cambios no confirmados del usuario. No revertir, sobrescribir ni borrar trabajo ajeno sin comprobar el diff y su uso. Limitar los cambios al alcance solicitado y documentar cualquier archivo eliminado por ser realmente inservible.
