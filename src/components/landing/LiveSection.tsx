import VideoBackdrop from './VideoBackdrop';

/** Sección de alto impacto: tracking en vivo, con dashboard holográfico de fondo. */
export default function LiveSection() {
  return (
    <section id="flow" className="relative flex min-h-[80svh] items-center overflow-hidden py-24 md:py-32">
      {/* Fondo: dashboard de tracking holográfico. */}
      <div className="absolute inset-0">
        <VideoBackdrop src="/assets/video/live.mp4" poster="/assets/video/live-poster.jpg" />
      </div>
      {/* Oscurecido para legibilidad de la card. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(70% 70% at 50% 50%, rgba(10,11,13,.78), rgba(10,11,13,.94))' }}
      />
      <div className="container-responsive relative z-10">
        <div className="glass-card mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Conductores en movimiento, en tiempo real
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/70">
            Ve quién está cerca y sigue cada trayecto al instante. La ciudad, viva.
          </p>
        </div>
      </div>
    </section>
  );
}
