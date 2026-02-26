import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet';
import AdminSidebar from './AdminSidebar';
import type { AdminSection } from '../types';

interface Props {
  activeSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
}

export default function AdminMobileSidebar({ activeSection, onNavigate }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 rounded-md hover:bg-accent transition-colors">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <AdminSidebar
          activeSection={activeSection}
          onNavigate={onNavigate}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
