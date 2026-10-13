import type { Loader, LoaderContext } from "astro/loaders";
import { excerpt, graphqlHeaders, redact, strapiFetch } from "../strapi-client";

type StrapiNode = Record<string, unknown>;

type Opts = {
  mode?: "collection" | "single";
  rootField: string;
  selection: string;
  client: { endpoint: string; headers?: Record<string, string> };
  pageSize?: number;
  cacheDurationInMs?: number;
  idResolver?: (node: StrapiNode) => string;
  status?: "PUBLISHED" | "DRAFT";
  locale?: string;
  /** Con `STRAPI_STRICT=true` un fallo de sincronización rompe el build en vez
   *  de publicar en silencio la caché o el contenido local. */
  strict?: boolean;
  /**
   * Selección de reserva, sin los campos más nuevos. Si el CMS todavía no los
   * conoce («Cannot query field»), la consulta se repite con esta en vez de
   * quedarse sin contenido. Hace falta porque la web y el CMS se despliegan
   * por separado y en cualquier orden: sin esto, añadir un campo al CMS y
   * pedirlo desde aquí vaciaba la colección si la web se construía primero.
   * Con varias, se prueban en orden: de la que menos quita a la que más.
   */
  fallbackSelection?: string | string[];
};

const NETWORK_TIMEOUT_MS = 30_000;
/* Un segundo intento solo ante fallos transitorios (red, 5xx de pasarela). */
const NETWORK_ATTEMPTS = 2;
const MAX_PAGES = 200;

const cap = (value: string) =>
  value ? value[0].toUpperCase() + value.slice(1) : value;
const squash = (value: string) => value.replace(/\s+/g, " ").trim();

const asNode = (value: unknown): StrapiNode | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as StrapiNode;
};

const asNodes = (value: unknown): StrapiNode[] => {
  if (!Array.isArray(value)) return [];
  return value.map(asNode).filter((node): node is StrapiNode => node !== null);
};

export function strapiLoader({
  mode = "collection",
  rootField,
  selection,
  client,
  pageSize = 25,
  cacheDurationInMs = 0,
  idResolver,
  status = "PUBLISHED",
  locale,
  fallbackSelection,
  strict = false,
}: Opts): Loader {
  const request = async (
    query: string,
    variables: Record<string, unknown>,
    operationName: string
  ): Promise<Record<string, unknown>> => {
    const secret = client.headers?.Authorization?.replace(/^Bearer\s+/i, "");
    const response = await strapiFetch(client.endpoint, {
      headers: graphqlHeaders(operationName, client.headers),
      body: JSON.stringify({ operationName, query, variables }),
      timeoutMs: NETWORK_TIMEOUT_MS,
      maxAttempts: NETWORK_ATTEMPTS,
      secret,
    });

    if (!response.ok)
      throw new Error(
        `GraphQL ${response.status} ${response.statusText}: ${excerpt(response.text, secret, 500)}`
      );

    const result = asNode(JSON.parse(response.text));
    const errors = result?.errors;
    if (Array.isArray(errors) && errors.length)
      throw new Error(redact(`GraphQL errors: ${JSON.stringify(errors)}`, secret));

    return asNode(result?.data) ?? {};
  };

  const getStableId = (node: StrapiNode, fallback: string) => {
    const custom = idResolver?.(node);
    if (typeof custom === "string" && custom.trim()) return custom;
    return String(node.documentId ?? node.id ?? fallback);
  };

  const isPublished = (node: StrapiNode) =>
    typeof node.publishedAt === "string" && node.publishedAt.length > 0;

  const getPreviousIds = (meta: LoaderContext["meta"]): string[] => {
    const stored = meta.get("ids");
    if (Array.isArray(stored))
      return stored.filter((id): id is string => typeof id === "string");
    if (typeof stored !== "string") return [];

    try {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [];
    } catch {
      return [];
    }
  };

  const singleQuery = (sel: string) =>
    squash(`
        query ${cap(rootField)}($status: PublicationStatus${
      locale ? ", $locale: I18NLocaleCode" : ""
    }) {
            ${rootField}(status: $status${locale ? ", locale: $locale" : ""}) {
                ${sel}
            }
        }
    `);

  const collectionQuery = (sel: string) =>
    squash(`
        query ${cap(
          rootField
        )}($page: Int!, $pageSize: Int!, $status: PublicationStatus${
      locale ? ", $locale: I18NLocaleCode" : ""
    }) {
            ${rootField}(pagination: { page: $page, pageSize: $pageSize }, status: $status${
      locale ? ", locale: $locale" : ""
    }) {
                ${sel}
            }
        }
    `);

  return {
    name: rootField,
    async load(ctx: LoaderContext) {
      const { store, meta, logger, generateDigest, parseData } = ctx;
      const lastSynced = meta.get("lastSynced");

      if (lastSynced && Date.now() - Number(lastSynced) < cacheDurationInMs) {
        logger.info(`[${rootField}] Skipping sync (cached)`);
        return;
      }

      /* La selección en uso: la completa, o la siguiente reserva cada vez
         que el CMS diga que no conoce algún campo. Se decide una vez por carga. */
      const reservas = fallbackSelection === undefined ? [] : Array.isArray(fallbackSelection) ? [...fallbackSelection] : [fallbackSelection];
      let activeSelection = selection;
      const consultar = async (
        build: (sel: string) => string,
        variables: Record<string, unknown>
      ): Promise<Awaited<ReturnType<typeof request>>> => {
        try {
          return await request(build(activeSelection), variables, cap(rootField));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          /* Campo que no existe («Cannot query field») o tipo de una unión
             que el CMS desplegado aún no tiene («Unknown type»). */
          const siguiente = reservas.shift();
          if (siguiente === undefined || !/Cannot query field|Unknown type/i.test(message)) throw error;
          logger.warn(`[${rootField}] El CMS aún no conoce algún campo pedido; se usa la selección de reserva.`);
          activeSelection = siguiente;
          return consultar(build, variables);
        }
      };

      try {
        const previousIds = getPreviousIds(meta);
        const seenIds = new Set<string>();

        if (mode === "single") {
          const variables: Record<string, unknown> = { status };
          if (locale) variables.locale = locale;

          const response = await consultar(singleQuery, variables);
          const node = asNode(response[rootField]);

          if (!node || (status === "PUBLISHED" && !isPublished(node))) {
            logger.warn(
              `[${rootField}] single: no hay contenido publicado; se conserva la caché local.`
            );
            return;
          }

          const id = getStableId(node, rootField);
          const data = await parseData({ id, data: node });
          store.set({ id, digest: generateDigest(data), data });
          seenIds.add(id);

          for (const oldId of previousIds) {
            if (!seenIds.has(oldId)) store.delete(oldId);
          }

          meta.set("ids", JSON.stringify([...seenIds]));
          meta.set("lastSynced", String(Date.now()));
          logger.info(
            `[${rootField}] Stored single id=${id}${
              locale ? ` [locale=${locale}]` : ""
            }`
          );
          return;
        }

        let page = 1;
        let stored = 0;

        while (page <= MAX_PAGES) {
          const response = await consultar(
            collectionQuery,
            locale ? { page, pageSize, status, locale } : { page, pageSize, status }
          );
          const pageNodes = asNodes(response[rootField]);
          const nodes = pageNodes.filter(
            (node) => status !== "PUBLISHED" || isPublished(node)
          );

          for (const [index, node] of nodes.entries()) {
            const id = getStableId(node, `${rootField}-${page}-${index}`);
            const data = await parseData({ id, data: node });
            store.set({ id, digest: generateDigest(data), data });
            seenIds.add(id);
            stored++;
          }

          /* Se compara con la página sin filtrar: un borrador descartado no
             significa que no queden más páginas. */
          if (pageNodes.length < pageSize) break;
          page++;
        }

        if (page > MAX_PAGES)
          logger.warn(
            `[${rootField}] Se alcanzó el máximo de ${MAX_PAGES} páginas.`
          );

        if (!stored) {
          logger.warn(
            `[${rootField}] collection: no hay contenido publicado; se conserva la caché local.`
          );
          return;
        }

        for (const oldId of previousIds) {
          if (!seenIds.has(oldId)) store.delete(oldId);
        }

        meta.set("ids", JSON.stringify([...seenIds]));
        meta.set("lastSynced", String(Date.now()));

        logger.info(
          `[${rootField}] collection: stored ${stored} documents${
            locale ? ` [locale=${locale}]` : ""
          }.`
        );
      } catch (error) {
        if (strict) throw error;
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(
          `[${rootField}] No se pudo sincronizar con Strapi; se conserva la caché local. ${message}`
        );
      }
    },
  };
}
