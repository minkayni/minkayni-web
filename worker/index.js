/* Worker delante de los archivos estáticos de la web (Cloudflare Workers con
   static assets). Reemplaza lo que hacía nginx.conf en el servidor:
   - minkayni.org redirige a www.minkayni.org (el canonical del sitio).
   - /media/<archivo> se sirve desde Strapi (/media/uploads/<archivo>) y queda
     en la caché de Cloudflare 30 días.
   - Las páginas en inglés sin traducción devuelven el 404 en inglés.
   Todo lo demás lo sirve env.ASSETS tal cual sale de `astro build`. */

const CMS = "https://strapi.minkayni.org";
const MEDIA_TTL = 60 * 60 * 24 * 30;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.hostname === "minkayni.org") {
      url.hostname = "www.minkayni.org";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname.startsWith("/media/")) {
      return media(request, url, ctx);
    }

    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && url.pathname.startsWith("/en/")) {
      const en404 = await env.ASSETS.fetch(new URL("/en/404/", url));
      if (en404.ok) {
        return new Response(en404.body, { status: 404, headers: en404.headers });
      }
    }
    return res;
  },
};

async function media(request, url, ctx) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const cache = caches.default;
  const key = new Request(url.toString(), { method: "GET" });
  const hit = await cache.match(key);
  if (hit) return hit;

  const file = url.pathname.slice("/media/".length);
  const upstream = await fetch(`${CMS}/media/uploads/${file}${url.search}`, {
    headers: { "X-Forwarded-Host": url.host },
  });

  const headers = new Headers(upstream.headers);
  headers.delete("set-cookie");
  if (upstream.ok) {
    headers.set("Cache-Control", `public, max-age=${MEDIA_TTL}, immutable`);
  } else {
    headers.set("Cache-Control", "public, max-age=60");
  }
  const res = new Response(upstream.body, { status: upstream.status, headers });
  if (upstream.ok || upstream.status === 404) {
    ctx.waitUntil(cache.put(key, res.clone()));
  }
  return res;
}
