import { ShieldX } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';

export default function AdminAccessDenied() {
  const { t } = useApp();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">{t('adminAccessDenied')}</h1>
        <p className="text-muted-foreground">{t('adminAccessDeniedDesc')}</p>
        <Button variant="outline" onClick={handleLogout}>
          {t('logout')}
        </Button>
      </div>
    </div>
  );
}
