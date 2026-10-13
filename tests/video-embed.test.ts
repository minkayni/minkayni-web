/* Enlaces del bloque «Vídeo»: qué se embebe y qué no. */
import assert from "node:assert/strict";
import test from "node:test";

import { parseVideoUrl } from "../src/utils/video-embed";

test("YouTube: todas las formas del enlace llevan al reproductor sin cookies", () => {
    for (const url of [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
        "https://youtu.be/dQw4w9WgXcQ?si=abc",
        "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "https://www.youtube.com/live/dQw4w9WgXcQ",
    ]) {
        const video = parseVideoUrl(url);
        assert.equal(video?.embed, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0", url);
        assert.equal(video?.thumbnail, "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
        assert.equal(video?.vertical, false);
    }
});

test("los Shorts son verticales", () => {
    const video = parseVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ");
    assert.equal(video?.vertical, true);
    assert.equal(video?.watch, "https://www.youtube.com/shorts/dQw4w9WgXcQ");
});

test("Vimeo, con y sin el dominio del reproductor", () => {
    assert.equal(parseVideoUrl("https://vimeo.com/76979871")?.embed, "https://player.vimeo.com/video/76979871?autoplay=1&dnt=1");
    assert.equal(parseVideoUrl("https://player.vimeo.com/video/76979871")?.watch, "https://vimeo.com/76979871");
    assert.equal(parseVideoUrl("https://vimeo.com/76979871")?.thumbnail, undefined);
});

test("lo que no es YouTube ni Vimeo, o no trae un id válido, no se embebe", () => {
    for (const url of [null, "", "no es una url", "http://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://example.com/v.mp4", "https://www.youtube.com/watch?v=corto", "https://vimeo.com/canal/sin-numero", "javascript:alert(1)"]) {
        assert.equal(parseVideoUrl(url), null, String(url));
    }
});
