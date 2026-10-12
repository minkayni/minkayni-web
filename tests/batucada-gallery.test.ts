/* Las polaroids del mapa de Batucada: dónde se colocan y de dónde salen.

   El defecto que motiva estas pruebas: las posiciones eran desplazamientos
   fijos en píxeles respecto al pin, así que en un teléfono las tarjetas se
   salían del marco del mapa por los cuatro lados —se comían la lista de
   sectores y se cortaban contra el borde de la pantalla—. La regla que no
   puede volver a romperse es que ninguna tarjeta se salga del marco. */
import assert from "node:assert/strict";
import test from "node:test";
import { galleryLayout, hoverCardPlacement, MAX_SPOTS, type GallerySpot } from "../src/scripts/batucada/gallery-layout";
import { genericSectorPhotos, MAX_SECTOR_PHOTOS, sectorPhotos } from "../src/utils/sector-photos";
import { clampOffset, distance, maxZoom, midpoint, offsetAfterZoom } from "../src/scripts/batucada/zoom";

const STRAPI = "https://strapi.minkayni.org";
const WEB = "https://www.minkayni.org";

/** Teléfono: el mapa es `aspect-[4/3]` con `min-h-[19rem]` dentro del margen. */
const PHONE = { width: 372, height: 304 };
/** Escritorio: columna derecha de la rejilla del territorio. */
const DESKTOP = { width: 700, height: 520 };

const edges = (spot: GallerySpot) => ({
    left: spot.x - spot.width / 2,
    right: spot.x + spot.width / 2,
    top: spot.y - spot.height / 2,
    bottom: spot.y + spot.height / 2,
});

test("en un teléfono ninguna polaroid se sale del mapa", () => {
    /* El pin queda centrado tras volar al sector, pero se prueban también las
       esquinas: un sector cerca del borde no puede empujar nada fuera. */
    const pins = [
        { x: PHONE.width / 2, y: PHONE.height / 2 },
        { x: 4, y: 4 },
        { x: PHONE.width - 4, y: PHONE.height - 4 },
    ];

    for (const pin of pins) {
        for (const spot of galleryLayout(PHONE, pin, 4)) {
            const box = edges(spot);
            assert.ok(box.left >= 0, `se sale por la izquierda: ${box.left}`);
            assert.ok(box.right <= PHONE.width, `se sale por la derecha: ${box.right}`);
            assert.ok(box.top >= 0, `se sale por arriba: ${box.top}`);
            assert.ok(box.bottom <= PHONE.height, `se sale por abajo: ${box.bottom}`);
        }
    }
});

test("en un teléfono son una tira al pie, sin pisarse ni tapar el botón del mapa", () => {
    const spots = galleryLayout(PHONE, { x: 186, y: 152 }, 4);
    assert.equal(spots.length, 4);

    /* Todas a la misma altura y en fila. */
    assert.ok(spots.every((spot) => spot.y === spots[0].y), "la tira no está alineada");
    for (let i = 1; i < spots.length; i += 1) {
        assert.ok(edges(spots[i]).left >= edges(spots[i - 1]).right, "las miniaturas se pisan");
    }

    /* Apoyada abajo pero dejando sitio al botón «ver los N sectores», que vive
       en la esquina inferior izquierda del mapa. */
    const bottom = edges(spots[0]).bottom;
    assert.ok(bottom < PHONE.height - 40, `la tira tapa el botón del mapa: ${bottom}`);
    assert.ok(bottom > PHONE.height / 2, "la tira debería ir abajo, no en medio");
});

test("con sitio de sobra vuelven al collage alrededor del pin", () => {
    const pin = { x: DESKTOP.width / 2, y: DESKTOP.height / 2 };
    const spots = galleryLayout(DESKTOP, pin, 4);
    assert.equal(spots.length, 4);

    /* Una en cada cuadrante: es lo que hace que parezcan esparcidas. */
    const quadrants = spots.map((spot) => `${spot.x < pin.x ? "i" : "d"}${spot.y < pin.y ? "a" : "b"}`);
    assert.deepEqual([...quadrants].sort(), ["da", "db", "ia", "ib"]);

    /* Ninguna encima del pin, que es el que se acaba de señalar. */
    for (const spot of spots) {
        assert.ok(Math.abs(spot.x - pin.x) > spot.width / 2 || Math.abs(spot.y - pin.y) > spot.height / 2, "una polaroid tapa el pin");
    }
});

test("el collage desborda de lado, nunca por arriba ni por abajo", () => {
    /* El desborde lateral es deliberado —la foto que se sale del marco es
       parte del collage—; el vertical es el que se comía el texto. */
    for (const spot of galleryLayout(DESKTOP, { x: 20, y: 30 }, 4)) {
        const box = edges(spot);
        assert.ok(box.top >= 0 && box.bottom <= DESKTOP.height, "se sale por arriba o por abajo");
        assert.ok(box.left >= -32 && box.right <= DESKTOP.width + 32, "desborda de lado más de lo permitido");
    }
});

test("nunca coloca más tarjetas de las que caben, ni ninguna sin fotos", () => {
    assert.equal(galleryLayout(DESKTOP, { x: 350, y: 260 }, 9).length, MAX_SPOTS);
    assert.equal(galleryLayout(DESKTOP, { x: 350, y: 260 }, 1).length, 1);
    assert.deepEqual(galleryLayout(DESKTOP, { x: 350, y: 260 }, 0), []);
    /* Un mapa todavía sin medir (display:none, o antes del primer layout). */
    assert.deepEqual(galleryLayout({ width: 0, height: 0 }, { x: 0, y: 0 }, 4), []);
});

test("la tarjeta de hover cae por debajo del pin cuando arriba no cabe", () => {
    const card = { width: 200, height: 152 };
    const alto = hoverCardPlacement(DESKTOP, { x: 350, y: 30 }, card);
    assert.equal(alto.below, true, "sin sitio arriba tenía que caer debajo");

    const medio = hoverCardPlacement(DESKTOP, { x: 350, y: 300 }, card);
    assert.equal(medio.below, false, "con sitio arriba se queda arriba");
});

test("la tarjeta de hover no se sale del marco por los lados", () => {
    const card = { width: 200, height: 152 };
    for (const x of [0, 10, PHONE.width - 10, PHONE.width]) {
        const place = hoverCardPlacement(PHONE, { x, y: 150 }, card);
        assert.ok(place.x - card.width / 2 >= -32, `se sale por la izquierda: ${place.x}`);
        assert.ok(place.x + card.width / 2 <= PHONE.width + 32, `se sale por la derecha: ${place.x}`);
    }
});

/* ───────────────────────────── fotos del sector ───────────────────────── */

test("las fotos del sector salen por el proxy de medios, en dos tamaños", () => {
    const [photo] = sectorPhotos([{ url: "/uploads/guasmo.jpg", alternativeText: "Ensayo en el Guasmo", width: 2000, height: 1200 }], STRAPI, "Foto del sector");

    assert.equal(photo.thumb, `${WEB}/media/guasmo.jpg?w=480&f=webp&v=2`);
    assert.equal(photo.full, `${WEB}/media/guasmo.jpg?w=1600&f=webp&v=2`);
    assert.ok(photo.srcset.includes(`${WEB}/media/guasmo.jpg?w=960&f=webp&v=2 960w`));
    assert.equal(photo.alt, "Ensayo en el Guasmo");
    assert.equal(photo.width, 2000);
});

test("cada sitio donde se ve la foto pide su tamaño, no el mayor", () => {
    /* Una miniatura de la tira se pinta a 80 px: pedirle los 1600 de la foto
       grande son cientos de kilobytes por miniatura en el teléfono de quien
       mira. Los recorta Imagor por el proxy /media. */
    const [photo] = sectorPhotos([{ url: "/uploads/guasmo.jpg" }], STRAPI, "Foto del sector");
    assert.equal(photo.strip, `${WEB}/media/guasmo.jpg?w=160&f=webp&v=2`);
    assert.equal(photo.thumb, `${WEB}/media/guasmo.jpg?w=480&f=webp&v=2`);
    assert.equal(photo.full, `${WEB}/media/guasmo.jpg?w=1600&f=webp&v=2`);
    /* La ampliada NO lleva ancho: es el archivo tal y como se subió, a su
       resolución completa, y solo se pide al ampliar. */
    assert.equal(photo.zoom, `${WEB}/media/guasmo.jpg`);
});

test("un sector sin fotos propias usa las genéricas del proyecto", () => {
    const alt = "Foto del sector Nigeria";
    assert.deepEqual(sectorPhotos([], STRAPI, alt), genericSectorPhotos(alt));
    assert.deepEqual(sectorPhotos(null, STRAPI, alt), genericSectorPhotos(alt));
    /* Y también si lo que llega del CMS no se puede publicar. */
    assert.deepEqual(sectorPhotos([{ url: "" }, { caption: "sin archivo" }, null], STRAPI, alt), genericSectorPhotos(alt));
    assert.equal(genericSectorPhotos(alt)[0].alt, alt);
});

test("una foto que el proxy no reconoce no se publica", () => {
    /* Rutas con `..` o de otro dominio: `strapiMediaUrl` devuelve vacío y esa
       foto se descarta en vez de emitir un <img> roto. */
    const photos = sectorPhotos(
        [{ url: "/uploads/../../etc/passwd" }, { url: "/uploads/buena.jpg" }],
        STRAPI,
        "Foto del sector",
    );
    assert.equal(photos.length, 1);
    assert.equal(photos[0].full, `${WEB}/media/buena.jpg?w=1600&f=webp&v=2`);
});

test("el texto alternativo del CMS manda, y si falta lo pone la página", () => {
    const photos = sectorPhotos(
        [{ url: "/uploads/a.jpg" }, { url: "/uploads/b.jpg", alternativeText: "  " }, { url: "/uploads/c.jpg", alternativeText: "Marcha" }],
        STRAPI,
        "Foto del sector Nigeria",
    );
    assert.deepEqual(
        photos.map((photo) => photo.alt),
        ["Foto del sector Nigeria", "Foto del sector Nigeria", "Marcha"],
    );
});

test("la leyenda de cada foto es la del archivo, y no se inventa", () => {
    /* La escribe quien sube la foto, en el campo Caption de la biblioteca de
       medios: se escribe una vez y vale allá donde se use esa foto. Solo se
       pinta si existe: el pie del visor no puede crecer con una línea
       vacía. */
    const photos = sectorPhotos(
        [
            { url: "/uploads/a.jpg", caption: "Ensayo abierto en la cancha, agosto de 2026" },
            { url: "/uploads/b.jpg", caption: "   " },
            { url: "/uploads/c.jpg" },
        ],
        STRAPI,
        "Foto del sector",
    );
    assert.deepEqual(
        photos.map((photo) => photo.caption),
        ["Ensayo abierto en la cancha, agosto de 2026", undefined, undefined],
    );
});

test("la leyenda y el texto alternativo son cosas distintas", () => {
    /* El alternativo describe la foto a quien no la ve; la leyenda la cuenta
       a todo el mundo. Copiar uno en otro deja a los lectores de pantalla
       oyendo la leyenda como si fuese la descripción. */
    const [photo] = sectorPhotos([{ url: "/uploads/a.jpg", caption: "Marcha del 12 de febrero" }], STRAPI, "Foto del sector Nigeria");
    assert.equal(photo.alt, "Foto del sector Nigeria");
    assert.equal(photo.caption, "Marcha del 12 de febrero");
});

test("el visor de un sector no se llena sin fin", () => {
    const many = Array.from({ length: 20 }, (_, index) => ({ url: `/uploads/foto-${index}.jpg` }));
    assert.equal(sectorPhotos(many, STRAPI, "Foto del sector").length, MAX_SECTOR_PHOTOS);
});

/* ──────────────────────────── zoom del visor ──────────────────────────── */

test("ampliar deja quieto el punto que hay bajo el dedo", () => {
    /* Es lo que distingue un zoom que se siente natural de uno que salta: el
       detalle que estabas mirando no se mueve de debajo del dedo. */
    const pointer = { x: 120, y: -40 };
    const after = offsetAfterZoom(pointer, { x: 0, y: 0 }, 1, 2);
    /* Con la foto centrada y sin desplazar, ampliar al doble hacia un punto
       lo aleja justo esa misma distancia del centro. */
    assert.deepEqual(after, { x: -120, y: 40 });

    /* Y encadenar dos ampliaciones es lo mismo que hacer una sola: el punto
       de la foto bajo el dedo sigue siendo el mismo. */
    const paso = offsetAfterZoom(pointer, offsetAfterZoom(pointer, { x: 0, y: 0 }, 1, 1.5), 1.5, 3);
    const directo = offsetAfterZoom(pointer, { x: 0, y: 0 }, 1, 3);
    assert.ok(Math.abs(paso.x - directo.x) < 0.0001 && Math.abs(paso.y - directo.y) < 0.0001);
});

test("la foto ampliada no deja ver marco vacío por ningún lado", () => {
    const frame = { width: 800, height: 500 };
    /* A escala 2 sobra la mitad del alto y del ancho para arrastrar. */
    assert.deepEqual(clampOffset({ x: 9999, y: 9999 }, 2, frame), { x: 400, y: 250 });
    assert.deepEqual(clampOffset({ x: -9999, y: -9999 }, 2, frame), { x: -400, y: -250 });
    /* Sin ampliar no hay nada que arrastrar: vuelve al centro. */
    assert.deepEqual(clampOffset({ x: 300, y: 120 }, 1, frame), { x: 0, y: 0 });
    /* Y un desplazamiento que ya cabe se respeta tal cual. */
    assert.deepEqual(clampOffset({ x: 100, y: -60 }, 2, frame), { x: 100, y: -60 });
});

test("el zoom llega hasta la resolución real, con suelo y techo", () => {
    /* Una foto de 2560 px vista a 1280 da justo 2 aumentos: es su resolución
       real, ni uno más. */
    assert.equal(maxZoom(2560, 1280), 2);
    /* Las genéricas del proyecto miden 400 px: sin suelo el gesto de ampliar
       parecería roto, así que siempre se permite algo. */
    assert.equal(maxZoom(400, 372), 1.8);
    /* Y un techo, porque pasado cierto punto ya no se ve la foto. */
    assert.equal(maxZoom(8000, 500), 4);
    /* Sin datos todavía (la foto aún no ha cargado) no se rompe. */
    assert.equal(maxZoom(0, 500), 1.8);
});

test("el pellizco mide distancia y punto medio entre los dos dedos", () => {
    assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
    assert.deepEqual(midpoint({ x: 0, y: 10 }, { x: 10, y: 0 }), { x: 5, y: 5 });
});
