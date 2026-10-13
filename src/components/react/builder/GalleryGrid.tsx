/* Mosaico de fotos que se abren en el visor (src/scripts/galeria.ts). Es
   React para que lo compartan la galería de cada actividad (Astro, en build),
   el bloque «Galería» del constructor y la vista previa del panel.

   Sin JavaScript cada miniatura es un enlace a la versión grande (1600 px),
   nunca al original de varios megas. Con cinco fotos o más, la primera abre
   el mosaico a doble tamaño. */
import type { ViewerPhoto } from "@/utils/sector-photos";
import type { ViewerStrings } from "@/scripts/batucada/viewer";

interface Props {
    photos: ViewerPhoto[];
    /** Pie del visor: de qué actividad o sección son las fotos. */
    caption: string;
    strings: ViewerStrings;
    /** «Ampliar la foto {index} de {count}». */
    openLabel: string;
}

const fill = (template: string, index: number, count: number) => template.replace("{index}", String(index)).replace("{count}", String(count));

export default function GalleryGrid({ photos, caption, strings, openLabel }: Props) {
    const withCover = photos.length >= 5;
    return (
        <ul
            className="mt-6 grid list-none grid-flow-row-dense grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
            data-gallery={JSON.stringify(photos)}
            data-gallery-strings={JSON.stringify(strings)}
            data-gallery-caption={caption}
        >
            {photos.map((photo, index) => {
                const big = withCover && index === 0;
                return (
                    <li key={index} className={big ? "col-span-2 row-span-2" : undefined}>
                        <a
                            href={photo.full}
                            data-gallery-photo={index}
                            className="group relative block overflow-hidden rounded-2xl bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            aria-label={fill(openLabel, index + 1, photos.length)}
                        >
                            <img
                                className="aspect-square w-full object-cover spring group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                                src={big ? photo.full : photo.thumb}
                                srcSet={big ? photo.srcset || undefined : undefined}
                                sizes={big ? "(min-width: 1024px) 550px, (min-width: 640px) 60vw, 90vw" : undefined}
                                width={photo.width ?? 600}
                                height={photo.height ?? 600}
                                alt={photo.alt}
                                loading="lazy"
                                decoding="async"
                            />
                            {photo.caption && (
                                <span
                                    className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10 text-sm leading-snug text-white ${big ? "" : "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"}`}
                                    aria-hidden="true"
                                >
                                    {photo.caption}
                                </span>
                            )}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}
