import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import AdminSidebar from './AdminSidebar';
import AdminMobileSidebar from './AdminMobileSidebar';
import type { AdminSection } from '../types';
import type { AdminUser } from '../types';

// Section components (lazy-loaded inside this file for simplicity)
import AdminDashboard from './sections/AdminDashboard';
import AdminUsers from './sections/AdminUsers';
import AdminCompanies from './sections/AdminCompanies';
import AdminSubscriptions from './sections/AdminSubscriptions';
import AdminFleet from './sections/AdminFleet';
import AdminMaintenance from './sections/AdminMaintenance';
import AdminDocuments from './sections/AdminDocuments';

interface Props {
  adminUser: AdminUser;
}

function SectionContent({ section }: { section: AdminSection }) {
  switch (section) {
    case 'dashboard':     return <AdminDashboard />;
    case 'users':         return <AdminUsers />;
    case 'companies':     return <AdminCompanies />;
    case 'subscriptions': return <AdminSubscriptions />;
    case 'fleet':         return <AdminFleet />;
    case 'maintenance':   return <AdminMaintenance />;
    case 'documents':     return <AdminDocuments />;
    default:              return <AdminDashboard />;
  }
}

export default function AdminLayout({ adminUser }: Props) {
  const { t } = useApp();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <AdminMobileSidebar activeSection={activeSection} onNavigate={setActiveSection} />
          <span className="font-semibold text-sm hidden md:block">{t('adminPortal')}</span>
        </div>
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">{adminUser.email}</span>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r bg-background shrink-0">
          <AdminSidebar activeSection={activeSection} onNavigate={setActiveSection} />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <SectionContent section={activeSection} />
        </main>
      </div>
    </div>
  );
}
