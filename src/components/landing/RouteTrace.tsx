import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

/** Ruta firma de ciudad con marcador de posición, dibujada a lo largo del scroll. */
const ROUTE_D =
  'M 80 60 C 220 120, 120 320, 340 360 S 620 520, 520 720 S 240 940, 460 1140';

export default function RouteTrace() {
  const root = useRef<SVGSVGElement>(null);
  const route = useRef<SVGPathElement>(null);
  const marker = useRef<SVGCircleElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    // Reduced motion: ruta ya dibujada, sin scrub.
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(route.current, { drawSVG: '100%' });
      gsap.set(marker.current, { opacity: 1 });
    });

    // Motion normal: dibujar al hacer scroll + mover marcador por la ruta.
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const path = route.current;
      if (!path) return;
      gsap.set(path, { drawSVG: '0%' });
      // Pre-posiciona el marcador en el inicio de la ruta y hazlo visible (evita salto desde 0,0).
      gsap.set(marker.current, {
        opacity: 1,
        motionPath: { path: ROUTE_D, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0 },
      });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });
      tl.to(path, { drawSVG: '100%', ease: 'none' }, 0);
      tl.to(
        marker.current,
        {
          motionPath: { path: ROUTE_D, align: path, alignOrigin: [0.5, 0.5] },
          ease: 'none',
        },
        0,
      );
    });
  }, { scope: root });

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-brand-ink" aria-hidden="true">
      <svg
        ref={root}
        viewBox="0 0 600 1200"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full opacity-70"
      >
        {/* Route line — brand yellow */}
        <path
          ref={route}
          d={ROUTE_D}
          fill="none"
          stroke="#FFD60A"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,214,10,0.6))' }}
        />
        {/* Current-position marker — brand green */}
        <circle
          ref={marker}
          r={7}
          fill="#2DD36F"
          opacity={0}
          style={{ filter: 'drop-shadow(0 0 10px rgba(45,211,111,0.9))' }}
        />
      </svg>
    </div>
  );
}
