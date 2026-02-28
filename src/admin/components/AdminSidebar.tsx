import {
  LayoutDashboard, Users, Building2, CreditCard,
  Car, Wrench, FileText, LogOut, Ticket,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useApp } from '../../contexts/AppContext';
import { cn } from '../../lib/utils';
import type { AdminSection } from '../types';
import { ADMIN_SIDEBAR_ITEMS } from '../types';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Car,
  Wrench,
  FileText,
  Ticket,
};

interface Props {
  activeSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  onClose?: () => void;
}

export default function AdminSidebar({ activeSection, onNavigate, onClose }: Props) {
  const { t } = useApp();

  const handleNav = (section: AdminSection) => {
    onNavigate(section);
    onClose?.();
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="h-14 flex items-center px-4 border-b shrink-0">
        <span className="font-bold text-lg tracking-tight">{t('adminPortal')}</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {ADMIN_SIDEBAR_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
