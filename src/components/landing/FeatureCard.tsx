import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
}

/** Glassmorphism feature card. Marked `data-reveal` for scroll-in animation. */
export default function FeatureCard({ icon: Icon, title, desc }: FeatureCardProps) {
  return (
    <div data-reveal className="glass-card group">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow/10 text-brand-yellow ring-1 ring-brand-yellow/20 transition-transform group-hover:scale-110">
        <Icon size={24} />
      </div>
      <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-white/60">{desc}</p>
    </div>
  );
}
