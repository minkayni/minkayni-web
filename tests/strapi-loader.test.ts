import assert from "node:assert/strict";
import test from "node:test";
import { strapiLoader } from "../src/utils/loaders/strapi-loader";

/* Un almacén y un contexto mínimos, lo justo que usa el cargador. */
const contexto = () => {
  const guardados = new Map<string, unknown>();
  const meta = new Map<string, string>();
  const avisos: string[] = [];
  return {
    guardados,
    avisos,
    ctx: {
      store: { set: ({ id, data }: { id: string; data: unknown }) => guardados.set(id, data), delete: (id: string) => guardados.delete(id) },
      meta: { get: (k: string) => meta.get(k), set: (k: string, v: string) => meta.set(k, v) },
      logger: { info() {}, warn: (m: string) => avisos.push(m) },
      generateDigest: () => "x",
      parseData: async ({ data }: { data: unknown }) => data,
    },
  };
};

const publicado = { documentId: "a1", publishedAt: "2026-01-01T00:00:00Z", caption: "hola" };

test("si el CMS aún no conoce un campo, repite con la selección de reserva", async () => {
  /* El caso real: la web pide `poster` antes de que el CMS se despliegue con
     ese campo. Sin reserva, la colección se quedaba vacía y el carrusel de la
     portada decía que no había publicaciones. */
  const consultas: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    const { query } = JSON.parse(String(init.body)) as { query: string };
    consultas.push(query);
    if (query.includes("poster"))
      return Response.json({ errors: [{ message: 'Cannot query field "poster" on type "Post".' }] });
    return Response.json({ data: { posts: [publicado] } });
  }) as typeof fetch;

  try {
    const { ctx, guardados, avisos } = contexto();
    const loader = strapiLoader({
      rootField: "posts",
      selection: "documentId publishedAt caption poster { url }",
      fallbackSelection: "documentId publishedAt caption",
      client: { endpoint: "https://cms.example.test/graphql" },
    });
    await loader.load(ctx as never);

    assert.equal(guardados.size, 1, "la colección no debe quedarse vacía");
    assert.equal(consultas.length, 2, "una consulta completa y una de reserva");
    assert.match(consultas[0], /poster/);
    assert.doesNotMatch(consultas[1], /poster/);
    assert.ok(avisos.some((a) => /reserva/.test(a)), "debe quedar constancia en el log");
  } finally {
    globalThis.fetch = original;
  }
});

test("un error que no es de esquema no se disfraza con la reserva", async () => {
  /* Un token caducado o un CMS caído no se arreglan quitando campos: ahí se
     conserva la caché, como siempre. */
  let llamadas = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    llamadas++;
    return Response.json({ errors: [{ message: "Forbidden access" }] });
  }) as typeof fetch;

  try {
    const { ctx, guardados } = contexto();
    const loader = strapiLoader({
      rootField: "posts",
      selection: "documentId publishedAt poster { url }",
      fallbackSelection: "documentId publishedAt",
      client: { endpoint: "https://cms.example.test/graphql" },
    });
    await loader.load(ctx as never);
    assert.equal(llamadas, 1);
    assert.equal(guardados.size, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("un bloque nuevo que el CMS aún no tiene también cae a la reserva", async () => {
  /* La web pide `... on ComponentBlocksGallery` antes de que el CMS se
     despliegue con ese bloque: GraphQL rechaza la consulta entera con
     «Unknown type». Sin reserva, /novedades perdía todas las actividades. */
  const consultas: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    const { query } = JSON.parse(String(init.body)) as { query: string };
    consultas.push(query);
    if (query.includes("ComponentBlocksGallery"))
      return Response.json({ errors: [{ message: 'Unknown type "ComponentBlocksGallery".' }] });
    return Response.json({ data: { activities: [publicado] } });
  }) as typeof fetch;

  try {
    const { ctx, guardados } = contexto();
    const loader = strapiLoader({
      mode: "collection",
      rootField: "activities",
      selection: "documentId publishedAt sections { __typename ... on ComponentBlocksGallery { id } }",
      fallbackSelection: "documentId publishedAt sections { __typename }",
      client: { endpoint: "https://cms.example.test/graphql" },
    });
    await loader.load(ctx as never);
    assert.equal(guardados.size, 1);
    assert.equal(consultas.length, 2);
  } finally {
    globalThis.fetch = original;
  }
});
