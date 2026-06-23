import { useEffect, useRef } from 'react';
import { useScroll, useVelocity } from 'framer-motion';
import { particleCount } from '../../lib/flowField';

interface P { x: number; y: number; vx: number; vy: number; color: string; }

/** Estelas tipo tráfico en canvas 2D; la velocidad de scroll acelera el flujo. */
export default function TrafficFlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const speedRef = useRef(0);

  useEffect(() => velocity.on('change', (v) => { speedRef.current = Math.min(Math.abs(v) / 1000, 6); }), [velocity]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const n = particleCount(canvas.offsetWidth, dpr);
    // ~70% yellow headlights, ~30% red taillights — assigned at creation
    const ps: P[] = Array.from({ length: n }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0.6 + Math.random() * 0.8,
      vy: (Math.random() - 0.5) * 0.4,
      color: Math.random() < 0.7 ? 'rgba(255,214,10,0.5)' : 'rgba(255,59,48,0.5)',
    }));

    let raf = 0;
    let running = true;
    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    const draw = () => {
      const boost = reduce ? 0 : speedRef.current;
      ctx.fillStyle = 'rgba(10,11,13,0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1.2 * dpr;
      for (const p of ps) {
        const len = (2 + boost * 6) * dpr;
        ctx.strokeStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * len, p.y - p.vy * len);
        ctx.stroke();
        p.x += p.vx * (1 + boost) * dpr;
        p.y += p.vy * (1 + boost) * dpr;
        if (p.x > canvas.width) { p.x = 0; p.y = Math.random() * canvas.height; }
      }
      if (!reduce && running) raf = requestAnimationFrame(draw);
    };
    draw(); // un frame siempre; loop solo si hay motion

    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
