import assert from "node:assert/strict";
import test from "node:test";
import { coverScale, strapiMediaSrcSet, strapiMediaUrl } from "../src/utils/media-url";

const STRAPI = "https://strapi.minkayni.org";
// Los medios se emiten desde el dominio de la web como /media/<archivo>, sin el
// `uploads/` interno de Strapi (Nginx lo añade al reenviar al CMS).
const WEB = "https://www.minkayni.org";

test("serves canonical CMS media from the web origin", () => {
    assert.equal(strapiMediaUrl("/media/uploads/photo one.jpg", STRAPI), `${WEB}/media/photo%20one.jpg`);
    assert.equal(strapiMediaUrl(`${WEB}/media/photo.jpg`, STRAPI), `${WEB}/media/photo.jpg`);
    // Una URL que ya apunta al proxy de la web se queda como está (idempotente).
    assert.equal(strapiMediaUrl(`${WEB}/media/photo.jpg`, STRAPI, 640), `${WEB}/media/photo.jpg?w=640&f=webp&v=2`);
    assert.equal(strapiMediaUrl(`${WEB}/media/photo.jpg`, STRAPI), strapiMediaUrl("/media/uploads/photo.jpg", STRAPI));
});

test("migrates legacy Strapi routes without an Imagor signature", () => {
    assert.equal(strapiMediaUrl("/api/imagor/uploads/photo.jpg", STRAPI), `${WEB}/media/photo.jpg`);
    assert.equal(strapiMediaUrl("/api/media/uploads/reel.mp4", STRAPI), `${WEB}/media/reel.mp4`);
    assert.equal(strapiMediaUrl("/uploads/logo.svg", STRAPI), `${WEB}/media/logo.svg`);
});

test("migrates direct s3-media-edge URLs to the web proxy", () => {
    assert.equal(strapiMediaUrl("https://img.minkayni.org/img/original/uploads/photo.jpg", STRAPI), `${WEB}/media/photo.jpg`);
    assert.equal(strapiMediaUrl("https://img.minkayni.org/raw/uploads/reel.mp4", STRAPI), `${WEB}/media/reel.mp4`);
});

test("adds width only to raster images", () => {
    assert.equal(strapiMediaUrl("/media/uploads/photo.jpg", STRAPI, 800), `${WEB}/media/photo.jpg?w=800&f=webp&v=2`);
    assert.equal(strapiMediaUrl("/media/uploads/retrato.png", STRAPI, 800), `${WEB}/media/retrato.png?w=800&f=webp&v=2`);
    /* WebP y GIF no se convierten: uno ya es moderno, el otro perdería la animación. */
    assert.equal(strapiMediaUrl("/media/uploads/foto.webp", STRAPI, 800), `${WEB}/media/foto.webp?w=800&v=2`);
    assert.equal(strapiMediaUrl("/media/uploads/anim.gif", STRAPI, 800), `${WEB}/media/anim.gif?w=800&v=2`);
    assert.equal(strapiMediaUrl("/media/uploads/logo.svg", STRAPI, 800), `${WEB}/media/logo.svg`);
    assert.equal(strapiMediaUrl("/media/uploads/reel.mp4", STRAPI, 800), `${WEB}/media/reel.mp4`);
});

test("generates responsive candidates through the web proxy", () => {
    assert.equal(
        strapiMediaSrcSet("/media/uploads/photo.jpg", STRAPI, [320, 640, 960]),
        [320, 640, 960].map((width) => `${WEB}/media/photo.jpg?w=${width}&f=webp&v=2 ${width}w`).join(", ")
    );
    assert.equal(strapiMediaSrcSet("/media/uploads/logo.svg", STRAPI, [320, 640]), "");
});

test("rejects traversal and preserves unrelated URLs", () => {
    assert.equal(strapiMediaUrl("/media/../private/file.jpg", STRAPI), "");
    assert.equal(strapiMediaUrl("/media/uploads/%2e%2e%2fprivate.jpg", STRAPI), "");
    assert.equal(strapiMediaUrl("/media/uploads/%252e%252e/private.jpg", STRAPI), "");
    assert.equal(strapiMediaUrl("/media/uploads/%255cprivate.jpg", STRAPI), "");
    assert.equal(strapiMediaUrl("https://www.example.org/cover.jpg", STRAPI), "https://www.example.org/cover.jpg");
    assert.equal(strapiMediaUrl("https://www.example.org/media/cover.jpg", STRAPI), "https://www.example.org/media/cover.jpg");
    assert.equal(strapiMediaUrl("data:image/png;base64,abc", STRAPI), "");
    assert.equal(strapiMediaUrl("javascript:/media/uploads/photo.jpg", STRAPI), "");
    assert.equal(strapiMediaUrl(undefined, STRAPI), "");
});

test("normalizes GraphQL format URLs and keeps encoded keys stable", () => {
    const source = "/media/uploads/thumbnail_DSC_4676_7e566c6b65.jpg";
    assert.equal(strapiMediaUrl(source, STRAPI, 640), `${WEB}/media/thumbnail_DSC_4676_7e566c6b65.jpg?w=640&f=webp&v=2`);
});

test("keeps video raw while optimizing its raster poster", () => {
    assert.equal(strapiMediaUrl("/media/uploads/reel.mp4", STRAPI), `${WEB}/media/reel.mp4`);
    assert.equal(strapiMediaUrl("/media/uploads/reel-poster.jpg", STRAPI, 800), `${WEB}/media/reel-poster.jpg?w=800&f=webp&v=2`);
});

test("never advertises widths larger than the original", () => {
    // Un original de 1080 px: 1600 y 2200 se funden en un único 1080w real.
    assert.equal(
        strapiMediaSrcSet("/media/uploads/foto.jpg", STRAPI, [480, 960, 1600, 2200], 1080),
        [480, 960, 1080].map((width) => `${WEB}/media/foto.jpg?w=${width}&f=webp&v=2 ${width}w`).join(", ")
    );
    assert.equal(strapiMediaSrcSet("/media/uploads/foto.jpg", STRAPI, [480, 960], null), strapiMediaSrcSet("/media/uploads/foto.jpg", STRAPI, [480, 960]));
});

test("coverScale widens sizes only for photos wider than their box", () => {
    assert.equal(coverScale(1, { width: 6000, height: 4000 }), 1.5);
    assert.equal(coverScale(3 / 4, { width: 2160, height: 3240 }), 1);
    assert.equal(coverScale(1, { width: null, height: 4000 }), 1);
    assert.equal(coverScale(1, undefined), 1);
});
