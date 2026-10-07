/**
 * Algunos pies llegan en HTML (por ejemplo `<p>…</p><p></p>`) en lugar de
 * texto plano, según la herramienta con la que se publicó. Se pasan a texto
 * con un salto de línea por párrafo para que el resto del módulo los trate
 * igual que a los demás; si no, Astro los escapa y se ve `<p>` en la página.
 */
export const aTextoPlano = (pie: string): string => {
    if (!/<[a-z!/][^>]*>/i.test(pie)) return pie;
    return pie
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6])\s*>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;|&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
        .replace(/&amp;/g, "&");
};

