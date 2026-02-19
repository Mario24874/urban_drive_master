import React from 'react';
import { Moon, Sun, LogOut, RefreshCw, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { UserData } from '../types';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SettingsSheetProps {
  user: UserData;
  onLogout: () => void;
}

const APP_VERSION = '0.0.0';

const SettingsSheet: React.FC<SettingsSheetProps> = ({ user, onLogout }) => {
  const { theme, setTheme, lang, setLang, t } = useApp();

  const initials = user.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0]?.toUpperCase() ?? '?');

  const handleCheckUpdates = () => {
    window.dispatchEvent(new CustomEvent('pwa-check-update'));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10">
          <Settings size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>{t('settings')}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* ── User Card ── */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <Avatar className="h-14 w-14">
                <AvatarImage src={user.photoURL} alt={user.displayName} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.displayName || user.email}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {user.userType === 'driver' ? '🚗 Driver' : '👤 User'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="mx-6 w-auto" />

          {/* ── Appearance ── */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('appearance')}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon size={18} className="text-muted-foreground" />
                ) : (
                  <Sun size={18} className="text-muted-foreground" />
                )}
                <span className="text-sm">{theme === 'dark' ? t('darkMode') : t('lightMode')}</span>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  theme === 'dark' ? 'bg-primary' : 'bg-input'
                }`}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <Separator className="mx-6 w-auto" />

          {/* ── Language ── */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('language')}
            </p>
            <div className="flex gap-2">
              <Button
                variant={lang === 'en' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setLang('en')}
              >
                🇺🇸 English
              </Button>
              <Button
                variant={lang === 'es' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setLang('es')}
              >
                🇪🇸 Español
              </Button>
            </div>
          </div>

          <Separator className="mx-6 w-auto" />

          {/* ── App ── */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('app')}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('appVersion')}</span>
              <span className="text-sm font-mono">{APP_VERSION}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleCheckUpdates}>
              <RefreshCw size={15} />
              {t('checkUpdates')}
            </Button>
          </div>

          <Separator className="mx-6 w-auto" />

          {/* ── Account ── */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('account')}
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-2"
              onClick={onLogout}
            >
              <LogOut size={15} />
              {t('logout')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
