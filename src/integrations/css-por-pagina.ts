/* CSS por página.
 *
 * Todo el CSS va dentro de cada HTML (`build.inlineStylesheets: "always"`,
 * ver astro.config.ts) y Tailwind genera una sola hoja con las utilidades de
 * TODO el sitio: unas 1.400 reglas y ~100 KB que cada página repetía aunque
 * usara una fracción. Eso solo ya era un tercio del presupuesto de HTML de
 * tests/ad-grants.test.ts.
 *
 * Tras la build, cada página se queda solo con las reglas de clase que pueden
 * aplicarse en ella. Se conserva una regla cuando todas las clases de alguno de
 * sus selectores aparecen en el HTML de la página o en el JavaScript que esa
 * página puede cargar, siguiendo sus imports estáticos y diferidos (el JS
 * añade clases en tiempo de ejecución: GSAP, islas de React, menús). Es
 * deliberadamente conservador: ante la duda, la regla se queda. Las reglas sin
 * clases (elementos, :root, @font-face, @keyframes, @property) no se tocan.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

const listar = (dir: string, ext: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? listar(p, ext) : p.endsWith(ext) ? [p] : [];
    });

/** `.md\:flex` → `md:flex`; `.w-\[calc\(100\%\+2px\)\]` → `w-[calc(100%+2px)]`. */
const desescapar = (s: string) => s.replace(/\\([0-9a-fA-F]{1,6}\s?|[^0-9a-fA-F])/g, (_, c: string) => (/^[0-9a-fA-F]/.test(c) ? String.fromCodePoint(parseInt(c, 16)) : c));

/** Las clases de un selector simple (sin listas con coma). */
const clasesDe = (selector: string): string[] => {
    /* Lo que va entre paréntesis (:is(), :not(), :where()…) no obliga a que
       la clase exista: `:not(.x)` casa justamente cuando no está. Lo que va
       entre corchetes es un atributo (`[data-x="a.b"]`), no una clase. Los
       paréntesis y corchetes escapados son parte del nombre de la clase. */
    let fuera = "";
    let nivel = 0;
    for (let i = 0; i < selector.length; i++) {
        const ch = selector[i];
        if (ch === "\\") {
            if (nivel === 0) fuera += ch + (selector[i + 1] ?? "");
            i++;
        } else if (ch === "(" || ch === "[") nivel++;
        else if (ch === ")" || ch === "]") nivel--;
        else if (nivel === 0) fuera += ch;
    }
    return [...fuera.matchAll(/\.((?:\\[0-9a-fA-F]{1,6}\s?|\\.|[\w-])+)/g)].map((m) => desescapar(m[1]));
};

/** Parte una lista de selectores por las comas de primer nivel. */
const alternativas = (selector: string): string[] => {
    const out: string[] = [];
    let nivel = 0;
    let actual = "";
    for (let i = 0; i < selector.length; i++) {
        const ch = selector[i];
        if (ch === "\\") {
            actual += ch + (selector[++i] ?? "");
            continue;
        }
        if (ch === "(" || ch === "[") nivel++;
        else if (ch === ")" || ch === "]") nivel--;
        if (ch === "," && nivel === 0) {
            out.push(actual);
            actual = "";
        } else actual += ch;
    }
    out.push(actual);
    return out;
};

/** Índice del `}` que cierra el bloque abierto en `inicio` (posición de `{`). */
const cierre = (css: string, inicio: number): number => {
    let nivel = 0;
    let comillas: string | null = null;
    for (let i = inicio; i < css.length; i++) {
        const ch = css[i];
        if (comillas) {
            if (ch === "\\") i++;
            else if (ch === comillas) comillas = null;
            continue;
        }
        if (ch === '"' || ch === "'") comillas = ch;
        else if (ch === "{") nivel++;
        else if (ch === "}" && --nivel === 0) return i;
    }
    return css.length - 1;
};

/** Grupos que contienen reglas y por eso se recorren por dentro. */
const AGRUPADORES = /^@(layer|media|supports|container|scope|starting-style)\b/;

export function podarCss(css: string, existe: (clase: string) => boolean): string {
    let out = "";
    let i = 0;
    while (i < css.length) {
        const llave = css.indexOf("{", i);
        const puntoYComa = css.indexOf(";", i);
        /* `@layer a,b;` o `@import …;`: sentencia sin bloque. */
        if (puntoYComa !== -1 && (llave === -1 || puntoYComa < llave)) {
            out += css.slice(i, puntoYComa + 1);
            i = puntoYComa + 1;
            continue;
        }
        if (llave === -1) {
            out += css.slice(i);
            break;
        }
        const cabecera = css.slice(i, llave);
        const fin = cierre(css, llave);
        const cuerpo = css.slice(llave + 1, fin);
        const cab = cabecera.trim();
        if (AGRUPADORES.test(cab)) {
            const dentro = podarCss(cuerpo, existe);
            if (dentro.trim()) out += `${cabecera}{${dentro}}`;
        } else if (cab.startsWith("@")) {
            out += css.slice(i, fin + 1);
        } else {
            /* Regla de estilo. CSS anidado (`&:hover{…}`) cuenta como parte
               del cuerpo: se decide por el selector exterior. */
            const util = alternativas(cab).some((alt) => clasesDe(alt).every(existe));
            if (util) out += css.slice(i, fin + 1);
        }
        i = fin + 1;
    }
    return out;
}

/** Fichas con aspecto de clase en un texto. Solo se corta por espacios y
    comillas: una clase de Tailwind puede llevar comas, llaves o `>`
    (`drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]`, `[&>svg]:w-4`). */
const fichas = (texto: string, destino: Set<string>) => {
    for (const m of texto.matchAll(/[^\s"'`]+/g)) destino.add(m[0]);
};

const entidades = (s: string) =>
    s.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (_, e: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'" })[e] ?? _);

/** Clases de los atributos `class` de un HTML, ya sin entidades. */
const clasesDelHtml = (html: string, destino: Set<string>) => {
    for (const m of html.matchAll(/\sclass="([^"]*)"/g)) for (const c of entidades(m[1]).split(/\s+/)) if (c) destino.add(c);
};

/* Un nombre de trozo de Vite (`Menu.DYl97YNp.js`) en cualquier forma en que
   se cite: `src`, `component-url`, import estático, `import()` o la lista de
   dependencias que Vite precarga. */
const TROZO = /[\w$-]+(?:\.[\w$-]+)*\.js\b/g;

export default function cssPorPagina(): AstroIntegration {
    return {
        name: "minkayni:css-por-pagina",
        hooks: {
            "astro:build:done": ({ dir, logger }) => {
                const raiz = fileURLToPath(dir);
                /* Fichas de cada trozo de JS y a qué otros trozos nombra. */
                const trozos = new Map<string, { fichas: Set<string>; nombra: string[] }>();
                for (const js of listar(raiz, ".js")) {
                    const codigo = fs.readFileSync(js, "utf8");
                    const propias = new Set<string>();
                    fichas(codigo, propias);
                    trozos.set(path.basename(js), { fichas: propias, nombra: [...codigo.matchAll(TROZO)].map((m) => m[0]) });
                }
                /** Fichas de todo el JS que la página puede llegar a cargar. */
                const fichasDeJs = (html: string): Set<string> => {
                    const vistos = new Set<string>();
                    const cola = [...html.matchAll(TROZO)].map((m) => m[0]).filter((n) => trozos.has(n));
                    const out = new Set<string>();
                    while (cola.length) {
                        const nombre = cola.pop()!;
                        if (vistos.has(nombre)) continue;
                        vistos.add(nombre);
                        const trozo = trozos.get(nombre)!;
                        for (const f of trozo.fichas) out.add(f);
                        for (const n of trozo.nombra) if (trozos.has(n) && !vistos.has(n)) cola.push(n);
                    }
                    return out;
                };

                let antes = 0;
                let despues = 0;
                for (const archivo of listar(raiz, ".html")) {
                    const html = fs.readFileSync(archivo, "utf8");
                    const delSitio = fichasDeJs(html);
                    const dePagina = new Set<string>();
                    /* Atributos `class` y también el resto del documento: los
                       scripts en línea, los `data-*` y las props de las islas
                       pueden nombrar clases. */
                    const sinEstilos = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, "");
                    clasesDelHtml(sinEstilos, dePagina);
                    fichas(sinEstilos, dePagina);
                    fichas(entidades(sinEstilos), dePagina);
                    const existe = (clase: string) => dePagina.has(clase) || delSitio.has(clase);
                    const nuevo = html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/g, (_, a: string, css: string, b: string) => a + podarCss(css, existe) + b);
                    antes += html.length;
                    despues += nuevo.length;
                    if (nuevo !== html) fs.writeFileSync(archivo, nuevo);
                }
                logger.info(`CSS sin usar retirado: ${Math.round((antes - despues) / 1024)} KB en total.`);
            },
        },
    };
}
