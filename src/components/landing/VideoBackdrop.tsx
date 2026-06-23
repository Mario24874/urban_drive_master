import { useEffect, useRef, useState } from 'react';

interface VideoBackdropProps {
  /** Ruta al MP4 (H.264). */
  src: string;
  /** Imagen poster: primer frame; único contenido bajo reduced-motion / save-data. */
  poster: string;
  className?: string;
  /** object-fit del video. */
  fit?: 'cover' | 'contain';
}

/**
 * Fondo de video ambiental: autoplay silencioso en loop, se pausa fuera del viewport
 * y degrada a una imagen estática (poster) bajo prefers-reduced-motion o ahorro de datos.
 * Decorativo — siempre aria-hidden.
 */
export default function VideoBackdrop({ src, poster, className = '', fit = 'cover' }: VideoBackdropProps) {
  const ref = useRef<HTMLVideoElement>(null);
  // Decide una sola vez si reproducimos video o solo el poster.
  const [staticOnly] = useState(() => {
    if (typeof window === 'undefined') return true;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    return reduce || Boolean(saveData);
  });

  useEffect(() => {
    if (staticOnly) return;
    const video = ref.current;
    if (!video) return;
    // Pausa el video cuando la sección sale del viewport (ahorra CPU/batería).
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [staticOnly]);

  const objectFit = fit === 'cover' ? 'object-cover' : 'object-contain';

  if (staticOnly) {
    return (
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none h-full w-full ${objectFit} ${className}`}
      />
    );
  }

  return (
    <video
      ref={ref}
      className={`pointer-events-none h-full w-full ${objectFit} ${className}`}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}
