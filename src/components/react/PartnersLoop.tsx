/* PartnersLoop — el LogoLoop de reactbits (copiado sin cambios en
   LogoLoop.tsx) con los ajustes del sitio: altura de logo distinta en móvil y
   escritorio, difuminado en los bordes del color crema del fondo y pausa al
   pasar el ratón. El LogoLoop fija su altura por una variable CSS inline, así
   que la responsividad se resuelve aquí con `matchMedia`, no con clases. */
import { useEffect, useState } from 'react';
import LogoLoop, { type LogoItem } from './LogoLoop';

interface Props {
  logos: LogoItem[];
  ariaLabel: string;
}

const DESKTOP = '(min-width: 768px)';

export default function PartnersLoop({ logos, ariaLabel }: Props) {
  const [desktop, setDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <LogoLoop
      logos={logos}
      speed={desktop ? 70 : 50}
      direction="left"
      logoHeight={desktop ? 84 : 56}
      gap={desktop ? 72 : 44}
      pauseOnHover
      chain
      fadeOut
      fadeOutColor="#FFF6E5"
      ariaLabel={ariaLabel}
      /* `partners-loop`: global.css acota cada logo por alto Y ancho. */
      className="partners-loop py-6 md:py-10"
    />
  );
}
