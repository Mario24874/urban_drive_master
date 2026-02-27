import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, LogOut, RefreshCw, Settings, Download, Car, UserRound, Sparkles, ExternalLink, Building2, Users, Wrench, FileText, BarChart2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../services/firebase';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';
import type { UserData } from '../types';
import type { SubscriptionTier } from '../features/enterprise/types/subscription';
import type { Company } from '../features/enterprise/types/company';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const PLAN_BADGE_STYLES: Record<SubscriptionTier, string> = {
  free:   'bg-white/10 text-white/50 border border-white/15',
  bronce: 'bg-gradient-to-r from-amber-700 to-amber-500 text-white',
  plata:  'bg-gradient-to-r from-slate-500 to-slate-300 text-white',
  oro:    'bg-gradient-to-r from-yellow-500 to-yellow-300 text-gray-900',
};
const PLAN_LABELS: Record<SubscriptionTier, string> = {
  free: 'Plan Gratuito', bronce: 'Bronce', plata: 'Plata', oro: 'Oro',
};

interface SettingsSheetProps {
  user: UserData;
  onLogout: () => void;
  onOpenPricing?: () => void;
  subscriptionTier?: SubscriptionTier;
  company?: Company | null;
  onOpenCompanySetup?: () => void;
  onOpenFleetManager?: () => void;
  onOpenDriverManager?: () => void;
  onOpenMaintenanceScheduler?: () => void;
  onOpenDocumentsDashboard?: () => void;
  onOpenFleetAnalytics?: () => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({
  user,
  onLogout,
  onOpenPricing,
  subscriptionTier = 'free',
  company,
  onOpenCompanySetup,
  onOpenFleetManager,
  onOpenDriverManager,
  onOpenMaintenanceScheduler,
  onOpenDocumentsDashboard,
  onOpenFleetAnalytics,
}) => {
  const { theme, setTheme, lang, setLang, t } = useApp();

  const [open, setOpen] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const functions = getFunctions(app);
      const createPortalSession = httpsCallable(functions, 'createPortalSession');
      const result = await createPortalSession();
      const { url } = result.data as { url: string };
      window.location.href = url;
    } catch {
      toast.error(t('portalError'));
    } finally {
      setIsOpeningPortal(false);
    }
  };

  // Update state — reads initial value from window flag set by PWAUpdateNotification
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(
    () => !!(window as any).__pwaUpdateAvailable,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'up-to-date' | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Listen for update events from PWAUpdateNotification
  useEffect(() => {
    const handleUpdateAvailable = () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
      setIsChecking(false);
      setCheckResult(null);
      setUpdateAvailable(true);
    };
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    return () => window.removeEventListener('pwa-update-available', handleUpdateAvailable);
  }, []);

  const initials = user.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0]?.toUpperCase() ?? '?');

  const handleCheckUpdates = () => {
    if (isChecking) return;
    setIsChecking(true);
    setCheckResult(null);
    window.dispatchEvent(new CustomEvent('pwa-check-update'));

    // Timeout: if no 'pwa-update-available' event arrives within 8 s → already up to date
    checkTimerRef.current = setTimeout(() => {
      setIsChecking(false);
      if (!(window as any).__pwaUpdateAvailable) {
        setCheckResult('up-to-date');
      }
    }, 8000);
  };

  /** Apply the pending update (worker stored in window by PWAUpdateNotification) */
  const handleApplyUpdate = () => {
    const worker = (window as any).__pwaNewWorker as ServiceWorker | undefined;
    if (worker) {
      worker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback: force reload will re-register the new SW
      window.location.reload();
    }
    (window as any).__pwaUpdateAvailable = false;
    setUpdateAvailable(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10 relative">
          <Settings size={20} />
          {/* Dot badge when update is pending */}
          {updateAvailable && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-orange-400" />
          )}
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
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    {user.userType === 'driver'
                      ? <><Car size={10} />Driver</>
                      : <><UserRound size={10} />User</>}
                  </Badge>
                  <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE_STYLES[subscriptionTier]}`}>
                    {PLAN_LABELS[subscriptionTier]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Subscription ── */}
          {onOpenPricing && (
            <div className="px-6 pb-4">
              {subscriptionTier === 'free' ? (
                <button
                  onClick={() => { setOpen(false); onOpenPricing?.(); }}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-600/15 via-yellow-500/10 to-orange-500/15 border border-amber-500/25 hover:border-amber-400/40 transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-300">{t('pricingTitle')}</p>
                      <p className="text-xs text-amber-300/50">Bronce · Plata · Oro</p>
                    </div>
                  </div>
                  <span className="text-amber-400/70 text-xs">→</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setOpen(false); onOpenPricing?.(); }}
                    className="w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles size={16} className="text-white/40 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('planActive')}</p>
                        <span className={`inline-flex items-center text-sm font-bold px-2.5 py-0.5 rounded-full mt-0.5 ${PLAN_BADGE_STYLES[subscriptionTier]}`}>
                          {PLAN_LABELS[subscriptionTier]}
                        </span>
                      </div>
                    </div>
                    <span className="text-white/30 text-xs">{t('planChangePlan')} →</span>
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 mt-2"
                    onClick={handleOpenPortal}
                    disabled={isOpeningPortal}
                  >
                    <ExternalLink size={15} />
                    {isOpeningPortal ? t('openingPortal') : t('manageSubscription')}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── Mi Empresa ── */}
          {subscriptionTier !== 'free' && onOpenCompanySetup && (
            <div className="px-6 pb-4">
              <Separator className="mb-4" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('myCompany')}
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 justify-start"
                  onClick={() => { setOpen(false); onOpenCompanySetup?.(); }}
                >
                  <Building2 size={15} />
                  {company ? company.name : t('setupCompany')}
                </Button>
                {company && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 justify-start"
                      onClick={() => { setOpen(false); onOpenFleetManager?.(); }}
                    >
                      <Car size={15} /> {t('manageFleet')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 justify-start"
                      onClick={() => { setOpen(false); onOpenDriverManager?.(); }}
                    >
                      <Users size={15} /> {t('manageDrivers')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 justify-start"
                      onClick={() => { setOpen(false); onOpenMaintenanceScheduler?.(); }}
                    >
                      <Wrench size={15} /> {t('manageMaintenance')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 justify-start"
                      onClick={() => { setOpen(false); onOpenDocumentsDashboard?.(); }}
                    >
                      <FileText size={15} /> {t('manageDocuments')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 justify-start"
                      onClick={() => { setOpen(false); onOpenFleetAnalytics?.(); }}
                    >
                      <BarChart2 size={15} /> {t('fleetAnalytics')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

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

            {/* Version row */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('appVersion')}</span>
              <span className="text-sm font-mono">{__APP_VERSION__}</span>
            </div>

            {/* Update available banner */}
            {updateAvailable && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center gap-2 min-w-0">
                  <Download size={16} className="text-orange-400 flex-shrink-0" />
                  <span className="text-sm text-orange-400 font-medium">
                    {t('updateAvailable')}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                  onClick={handleApplyUpdate}
                >
                  {t('update')}
                </Button>
              </div>
            )}

            {/* Check for updates button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleCheckUpdates}
              disabled={isChecking || updateAvailable}
            >
              <RefreshCw size={15} className={isChecking ? 'animate-spin' : ''} />
              {isChecking ? t('lookingForUpdates') : t('checkUpdates')}
            </Button>

            {/* Result of last check */}
            {checkResult === 'up-to-date' && (
              <p className="text-xs text-center text-muted-foreground">
                {t('alreadyUpToDate')}
              </p>
            )}
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
