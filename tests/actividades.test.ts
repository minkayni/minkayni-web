/* Actividades de campo en /novedades: orden, filtros, fechas y rutas por
   idioma. Los datos los crea el Reportero de campo del CMS. */
import assert from "node:assert/strict";
import test from "node:test";

import { actividadesRelacionadas, actividadPrincipal, aniosDe, enlaceMapa, esPublicable, formatearFechas, marcasDe, ordenarActividades, resumirActividad } from "../src/utils/actividades-core";
import { alternatePaths, localizePath, stripLocale } from "../src/i18n";

const base = { slug: "taller", title: "Taller", date: "2026-09-12", brand: "batucada" as const, summary: "Resumen", publishedAt: "2026-09-13T00:00:00Z" };

test("solo se publican las actividades con slug, título y fecha", () => {
    assert.equal(esPublicable(base), true);
    assert.equal(esPublicable({ ...base, slug: " " }), false);
    assert.equal(esPublicable({ ...base, title: null }), false);
    assert.equal(esPublicable({ ...base, date: "12/09/2026" }), false);
});

test("las fechas no se corren por la zona horaria y los rangos se juntan", () => {
    assert.equal(formatearFechas("2026-09-01", null, "es"), "1 de septiembre de 2026");
    assert.equal(formatearFechas("2026-09-01", "2026-09-01", "es"), "1 de septiembre de 2026");
    assert.match(formatearFechas("2026-09-20", "2026-09-21", "es"), /20.*21 de septiembre de 2026/);
    assert.equal(formatearFechas("2026-09-01", null, "en"), "1 September 2026");
});

test("el resumen trae marca, año y etiquetas limpias", () => {
    const r = resumirActividad({ ...base, tags: ["percusión", "", "taller"], place_name: " Bastión Popular " }, "es", "https://strapi.example.org");
    assert.equal(r.marca, "batucada");
    assert.equal(r.anio, "2026");
    assert.equal(r.lugar, "Bastión Popular");
    assert.deepEqual(r.etiquetas, ["percusión", "taller"]);
    assert.equal(resumirActividad({ ...base, brand: null }, "es", "").marca, "minkayni");
});

test("orden, destacada, años y marcas", () => {
    const lista = [
        { titulo: "A", fechaIso: "2025-11-20", destacada: false, anio: "2025", marca: "batucada" as const },
        { titulo: "B", fechaIso: "2026-09-12", destacada: false, anio: "2026", marca: "minkayni" as const },
        { titulo: "C", fechaIso: "2026-08-30", destacada: true, anio: "2026", marca: "minkayni" as const },
    ];
    const ordenadas = ordenarActividades(lista);
    assert.deepEqual(ordenadas.map((a) => a.titulo), ["B", "C", "A"]);
    assert.equal(actividadPrincipal(ordenadas)?.titulo, "C", "la destacada manda sobre la más reciente");
    assert.equal(actividadPrincipal(ordenadas.map((a) => ({ ...a, destacada: false })))?.titulo, "B");
    assert.deepEqual(aniosDe(lista), ["2026", "2025"]);
    assert.deepEqual(marcasDe(lista), ["minkayni", "batucada"]);
});

test("el enlace al mapa solo existe con coordenadas", () => {
    assert.equal(enlaceMapa(-2.09, -79.92), "https://www.openstreetmap.org/?mlat=-2.09&mlon=-79.92#map=16/-2.09/-79.92");
    assert.equal(enlaceMapa(null, -79.92), undefined);
});

test("cada actividad tiene su gemela en el otro idioma", () => {
    assert.equal(localizePath("/novedades/taller/", "en"), "/en/news/taller/");
    assert.equal(localizePath("/en/news/taller/", "es"), "/novedades/taller/");
    assert.equal(stripLocale("/en/news/taller"), "/novedades/taller");
    assert.deepEqual(alternatePaths("/novedades/taller/"), [
        { locale: "es", path: "/novedades/taller/" },
        { locale: "en", path: "/en/news/taller/" },
    ]);
    /* Rutas parecidas que no son subpáginas no se tocan. */
    assert.equal(localizePath("/novedades", "en"), "/en/news");
    assert.equal(stripLocale("/en/newsletter"), "/newsletter");
});

test("más actividades: primero la misma marca, sin repetir la actual", () => {
    const lista = [
        { slug: "a", marca: "minkayni" as const },
        { slug: "b", marca: "batucada" as const },
        { slug: "c", marca: "minkayni" as const },
        { slug: "d", marca: "batucada" as const },
        { slug: "e", marca: "batucada" as const },
    ];
    assert.deepEqual(actividadesRelacionadas(lista, { slug: "b", marca: "batucada" }).map((a) => a.slug), ["d", "e", "a"]);
    assert.deepEqual(actividadesRelacionadas(lista, { slug: "a", marca: "minkayni" }, 2).map((a) => a.slug), ["c", "b"]);
    assert.deepEqual(actividadesRelacionadas([lista[0]], lista[0]), []);
});

test("el resumen cuenta solo las fotos de la galería", () => {
    const gallery = [{ url: "/uploads/a.jpg", mime: "image/jpeg" }, { url: "/uploads/b.mp4", mime: "video/mp4" }, { url: "/uploads/c.png" }];
    assert.equal(resumirActividad({ ...base, gallery }, "es", "https://strapi.example.org").fotos, 2);
    assert.equal(resumirActividad(base, "es", "https://strapi.example.org").fotos, 0);
});

test("el resumen guarda las publicaciones de redes que cuentan la actividad", () => {
    const r = resumirActividad(
        {
            ...base,
            social_posts: [{ documentId: "abc", permalink: "https://www.instagram.com/p/X/" }, null],
            social_links: [{ platform: "tiktok", url: "https://www.tiktok.com/@minkayni/video/1" }, { platform: "linkedin", url: null }],
        },
        "es",
        "https://strapi.example.org"
    );
    assert.deepEqual(r.publicaciones, ["abc", "https://www.instagram.com/p/X/", "https://www.tiktok.com/@minkayni/video/1"]);
});
