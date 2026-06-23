import { useEffect } from 'react';
import SmoothScroll from './SmoothScroll';
import RouteTrace from './RouteTrace';
import TopNav from './TopNav';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import LiveSection from './LiveSection';
import CtaSection from './CtaSection';

/** Landing público: nav + fondo de ruta neón + secciones con motion ligado a movilidad. */
export default function Landing() {
  // El shell de la app fija html/body/#root a 100% (scroller = #root). El landing
  // necesita scroll en la ventana para que Lenis y ScrollTrigger funcionen.
  useEffect(() => {
    document.documentElement.classList.add('landing-scroll');
    return () => document.documentElement.classList.remove('landing-scroll');
  }, []);

  return (
    <SmoothScroll>
      <RouteTrace />
      <TopNav />
      <main className="relative">
        <HeroSection />
        <FeaturesSection />
        <LiveSection />
        <CtaSection />
      </main>
    </SmoothScroll>
  );
}
