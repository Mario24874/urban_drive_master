import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Reveals elements marked with `data-reveal` inside `scope` as they scroll
 * into view. No-op under prefers-reduced-motion, so content stays visible.
 */
export function useGsapReveal(scope: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((item) => {
        gsap.from(item, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 85%' },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [scope]);
}
