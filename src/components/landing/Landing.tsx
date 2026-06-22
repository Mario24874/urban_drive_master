import SmoothScroll from './SmoothScroll';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import CtaSection from './CtaSection';

/** Public marketing landing: smooth-scrolled hero + features + CTA. */
export default function Landing() {
  return (
    <SmoothScroll>
      <div className="bg-brand-ink">
        <HeroSection />
        <FeaturesSection />
        <CtaSection />
      </div>
    </SmoothScroll>
  );
}
