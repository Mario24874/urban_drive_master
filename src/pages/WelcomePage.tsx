import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import UrbanDriveLogo from '/assets/UrbanDrive.png';

/**
 * Animated branded intro. Reveals the logo with a neon glow, then routes to the
 * landing. Under reduced-motion it skips the animation and redirects quickly.
 */
const WelcomePage = () => {
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (!reduce) {
        gsap.from('[data-intro]', {
          opacity: 0,
          scale: 0.9,
          y: 16,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.15,
        });
        gsap.to('[data-glow]', {
          opacity: 0.9,
          scale: 1.1,
          duration: 1.4,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      }
    }, root);

    const timer = setTimeout(() => navigate('/home'), reduce ? 600 : 2400);
    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, [navigate]);

  return (
    <div
      ref={root}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-brand-ink text-white"
    >
      <div
        data-glow
        className="pointer-events-none absolute h-72 w-72 rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,.4), transparent 65%)' }}
      />
      <img
        data-intro
        src={UrbanDriveLogo}
        alt="Urban Drive"
        className="relative h-28 w-28 rounded-2xl object-cover"
      />
      <p data-intro className="relative mt-6 font-display text-2xl font-bold tracking-tight">
        Urban Drive
      </p>
      <p data-intro className="relative mt-2 text-sm uppercase tracking-widest text-brand-cyan/80">
        Movilidad en tiempo real
      </p>
    </div>
  );
};

export default WelcomePage;
