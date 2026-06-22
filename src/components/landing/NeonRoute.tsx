import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

/**
 * Decorative neon "route" motif: an SVG path that draws itself on mount and a
 * glowing dot that travels along it. Purely visual (hidden from a11y tree).
 * Under reduced-motion the path is shown fully drawn with no animation.
 */
export default function NeonRoute({ className = '' }: { className?: string }) {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!path) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: reduce ? 0 : len });
    if (reduce) return;

    const tl = gsap.timeline();
    tl.to(path, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' });

    let move: gsap.core.Tween | undefined;
    if (dot) {
      const tracker = { p: 0 };
      move = gsap.to(tracker, {
        p: 1,
        duration: 6,
        ease: 'none',
        repeat: -1,
        onUpdate: () => {
          const pt = path.getPointAtLength(tracker.p * len);
          gsap.set(dot, { attr: { cx: pt.x, cy: pt.y } });
        },
      });
    }

    return () => {
      tl.kill();
      move?.kill();
    };
  }, []);

  return (
    <svg aria-hidden="true" viewBox="0 0 400 300" className={className} fill="none">
      <defs>
        <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        ref={pathRef}
        d="M20 250 C 80 250 90 130 160 130 S 280 70 330 70 S 380 130 380 50"
        stroke="#00E5FF"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#neon-glow)"
      />
      <circle ref={dotRef} cx="20" cy="250" r="6" fill="#B6FF3C" filter="url(#neon-glow)" />
    </svg>
  );
}
