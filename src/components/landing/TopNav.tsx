import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useScrolled } from '../../hooks/useScrolled';
import { scrollToSection } from '../../lib/scroll';
import {
  Sheet, SheetContent, SheetTrigger,
} from '@/components/ui/sheet';

const NAV = [
  { label: 'Funciones', target: '#features' },
  { label: 'En vivo', target: '#flow' },
  { label: 'Empezar', target: '#cta' },
];

const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
  <>
    {NAV.map((item) => (
      <button
        key={item.target}
        onClick={() => { scrollToSection(item.target); onNavigate?.(); }}
        className="font-display text-sm font-medium text-white/80 transition-colors hover:text-brand-yellow"
      >
        {item.label}
      </button>
    ))}
  </>
);

export default function TopNav() {
  const scrolled = useScrolled(10);
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-brand-ink/80 py-2 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent py-4'
      }`}
    >
      <div className="container-responsive flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/assets/UrbanDrive.png" alt="Urban Drive" className="h-8 w-8 rounded-xl" />
          <span className="font-display text-lg font-bold text-white">Urban Drive</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          <NavLinks />
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="ghost-btn !px-5 !py-2 text-sm">Iniciar sesión</Link>
          <Link to="/register" className="glow-btn !px-5 !py-2 text-sm">Empezar</Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="lg:hidden text-white" aria-label="Abrir menú">
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" className="border-white/10 bg-brand-ink/95 backdrop-blur-xl">
            <div className="mt-10 flex flex-col gap-6">
              <NavLinks onNavigate={() => setOpen(false)} />
              <Link to="/login" className="ghost-btn w-full">Iniciar sesión</Link>
              <Link to="/register" className="glow-btn w-full">Empezar</Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
