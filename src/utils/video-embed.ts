/* Enlaces de YouTube y Vimeo del bloque «Vídeo» del constructor, traducidos
   a lo que necesita la fachada (src/scripts/video-embed.ts): el reproductor
   embebido no se carga hasta que alguien pulsa «reproducir». Un iframe de
   YouTube son ~1 MB de JavaScript ajeno; con la fachada, una página con
   vídeo pesa lo mismo que sin él hasta ese clic.

   YouTube va por youtube-nocookie.com (no deja cookies hasta reproducir) y
   Vimeo con `dnt=1`. Un enlace de otro sitio no se embebe. */

export interface VideoEmbed {
    provider: "youtube" | "vimeo";
    /** Reproductor embebido, con reproducción automática: se carga tras el clic. */
    embed: string;
    /** El vídeo en su sitio: destino del enlace sin JavaScript. */
    watch: string;
    /** Miniatura que pinta la fachada; Vimeo no tiene una URL fija. */
    thumbnail?: string;
    /** Los Shorts son verticales. */
    vertical: boolean;
}

const YOUTUBE_ID = /^[\w-]{11}$/;

export function parseVideoUrl(raw: string | null | undefined): VideoEmbed | null {
    if (!raw) return null;
    let url: URL;
    try {
        url = new URL(raw.trim());
    } catch {
        return null;
    }
    if (url.protocol !== "https:") return null;
    const host = url.hostname.replace(/^(www|m)\./, "");
    const parts = url.pathname.split("/").filter(Boolean);

    if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
        let id: string | null = null;
        let vertical = false;
        if (host === "youtu.be") id = parts[0] ?? null;
        else if (parts[0] === "watch") id = url.searchParams.get("v");
        else if (["shorts", "embed", "live"].includes(parts[0] ?? "")) {
            id = parts[1] ?? null;
            vertical = parts[0] === "shorts";
        }
        if (!id || !YOUTUBE_ID.test(id)) return null;
        return {
            provider: "youtube",
            embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
            watch: vertical ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            vertical,
        };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
        const id = [...parts].reverse().find((p) => /^\d+$/.test(p));
        if (!id) return null;
        return {
            provider: "vimeo",
            embed: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`,
            watch: `https://vimeo.com/${id}`,
            vertical: false,
        };
    }

    return null;
}
