import { useRef } from 'react';
import { MapPin, MessageSquare, Smartphone } from 'lucide-react';
import FeatureCard from './FeatureCard';
import { useGsapReveal } from '../../hooks/useGsapReveal';

const FEATURES = [
  { icon: MapPin, title: 'Tiempo real', desc: 'Localiza conductores y contactos en el mapa al instante.' },
  { icon: MessageSquare, title: 'Mensajería', desc: 'Habla directo con conductores sin salir de la app.' },
  { icon: Smartphone, title: 'Multi-dispositivo', desc: 'Instálala como app nativa en Android, iOS y web.' },
];

export default function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  useGsapReveal(ref);

  return (
    <section id="features" ref={ref} className="py-24 md:py-32">
      <div className="container-responsive">
        <h2 data-reveal className="text-center font-display text-3xl font-bold text-white sm:text-4xl">
          Todo lo que necesitas para moverte
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </div>
    </section>
  );
}
