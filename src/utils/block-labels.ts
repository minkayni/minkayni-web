/* Etiquetas de interfaz que necesitan los bloques del constructor (visor de
   fotos, fachada de vídeo). Llegan ya traducidas: BuilderBlocks también corre
   en la vista previa, en el navegador, y no debe arrastrar el diccionario
   entero de src/i18n/ui.ts a ese paquete. */
import type { ViewerStrings } from "../scripts/batucada/viewer";
import type { useTranslations } from "../i18n";
import { viewerStrings } from "./viewer-strings";

export interface BlockLabels {
    viewer: ViewerStrings;
    /** «Ampliar la foto {index} de {count}». */
    openPhoto: string;
    playVideo: string;
    /** «Ver en {provider}». */
    watchOn: string;
}

export const blockLabels = (t: ReturnType<typeof useTranslations>): BlockLabels => ({
    viewer: viewerStrings(t),
    openPhoto: t("viewer.open"),
    playVideo: t("blocks.playVideo"),
    watchOn: t("blocks.watchOn"),
});
