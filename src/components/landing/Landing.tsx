import SmoothScroll from './SmoothScroll';
import RouteTrace from './RouteTrace';
import TopNav from './TopNav';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import LiveSection from './LiveSection';
import CtaSection from './CtaSection';

/** Landing público: nav + fondo de ruta neón + secciones con motion ligado a movilidad. */
export default function Landing() {
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
