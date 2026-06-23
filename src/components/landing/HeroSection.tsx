import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import VideoBackdrop from './VideoBackdrop';

/**
 * Full-viewport hero: animated headline + CTAs on the left, a neon route motif
 * on the right that reacts to mouse movement ("free motion"). Animations are
 * skipped under prefers-reduced-motion; content remains fully visible.
 */
export default function HeroSection() {
  const root = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (!reduce) {
        gsap.from('[data-hero]', {
          opacity: 0,
          y: 30,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.1,
        });
      }
    }, el);

    if (reduce || !art.current) return () => ctx.revert();

    const onMove = (e: MouseEvent) => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(art.current, {
        x: cx * 24,
        y: cy * 24,
        rotateX: -cy * 6,
        rotateY: cx * 6,
        duration: 0.6,
        ease: 'power2.out',
      });
    };
    window.addEventListener('mousemove', onMove);

    return () => {
      window.removeEventListener('mousemove', onMove);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-brand-ink text-white"
    >
      {/* Fondo cinematográfico: autopista nocturna con estelas de luces. */}
      <div className="absolute inset-0">
        <VideoBackdrop src="/assets/video/hero.mp4" poster="/assets/video/hero-poster.jpg" />
      </div>
      {/* Oscurecido + viñeta: legibilidad del texto y enmascara la suavidad del video. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(10,11,13,.92) 0%, rgba(10,11,13,.72) 38%, rgba(10,11,13,.45) 100%), radial-gradient(120% 80% at 50% 100%, rgba(10,11,13,.7), transparent 60%)',
        }}
      />
      <div className="container-responsive relative z-10 grid items-center gap-10 py-20 md:grid-cols-2">
        <div>
          <p data-hero className="mb-4 font-display text-sm uppercase tracking-widest text-brand-yellow">
            Movilidad urbana en tiempo real
          </p>
          <h1 data-hero className="font-display text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
            Muévete por
            <br />
            la ciudad,
            <br />
            <span className="text-brand-yellow">en vivo.</span>
          </h1>
          <p data-hero className="mt-6 max-w-md text-lg text-white/70">
            Localiza conductores en tiempo real, comunícate al instante y llega más rápido. Todo en
            una app.
          </p>
          <div data-hero className="mt-8 flex flex-wrap gap-4">
            <Link to="/register" className="glow-btn">
              Empezar →
            </Link>
            <Link to="/login" className="ghost-btn">
              Iniciar sesión
            </Link>
          </div>
        </div>
        <div ref={art} data-hero className="relative [transform-style:preserve-3d]">
          <div className="mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl ring-1 ring-brand-yellow/20 drop-shadow-[0_0_40px_rgba(255,214,10,.25)]">
            <VideoBackdrop src="/assets/video/logoanim.mp4" poster="/assets/video/logoanim-poster.jpg" />
          </div>
        </div>
      </div>
    </section>
  );
}
