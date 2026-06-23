import TrafficFlowField from './TrafficFlowField';

/** Sección de alto impacto: conductores en movimiento, con fondo de campo de tráfico. */
export default function LiveSection() {
  return (
    <section id="flow" className="relative overflow-hidden py-24 md:py-32">
      <TrafficFlowField />
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
