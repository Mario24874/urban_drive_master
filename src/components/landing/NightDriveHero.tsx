/** Fondo de hero: parallax nocturno (skyline + carretera con punto de fuga + barrido de faros).
 *  Movido por CSS scroll-timeline (0 KB JS). Estático bajo prefers-reduced-motion. */
export default function NightDriveHero() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Skyline lejano */}
      <div
        className="nd-skyline absolute inset-x-0 bottom-1/3 h-1/3 opacity-30"
        style={{ background: 'linear-gradient(to top, rgba(255,214,10,0.10), transparent)' }}
      />
      {/* Carretera con punto de fuga */}
      <div
        className="nd-road absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            'conic-gradient(from 90deg at 50% 0%, transparent 0deg, rgba(255,214,10,0.06) 20deg, transparent 40deg)',
          maskImage: 'linear-gradient(to top, black, transparent)',
        }}
      />
      {/* Barrido de faros */}
      <div
        className="nd-lights absolute inset-0 opacity-50"
        style={{ background: 'radial-gradient(40% 30% at 30% 40%, rgba(255,159,10,0.12), transparent 70%)' }}
      />
    </div>
  );
}
