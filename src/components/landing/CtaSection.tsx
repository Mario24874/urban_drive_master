import { Link } from 'react-router-dom';

/** Closing call-to-action with an ambient neon glow. */
export default function CtaSection() {
  return (
    <section id="cta" className="relative overflow-hidden py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: 'radial-gradient(50% 60% at 50% 50%, rgba(255,214,10,.15), transparent 70%)' }}
      />
      <div className="container-responsive relative z-10 text-center">
        <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
          ¿Listo para moverte mejor?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/70">
          Crea tu cuenta gratis y empieza a localizar conductores en segundos.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="glow-btn">
            Crear cuenta
          </Link>
          <Link to="/login" className="ghost-btn">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  );
}
