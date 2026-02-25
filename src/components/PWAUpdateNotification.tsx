import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '../contexts/AppContext';

/**
 * Listens for Service Worker updates and shows a persistent dialog.
 * The dialog requires an explicit user decision (Update now / Later).
 *
 * Global side-effects used for cross-component state:
 *   window.__pwaUpdateAvailable  – true when a new SW is installed but waiting
 *   window.__pwaNewWorker        – the waiting ServiceWorker instance
 *   CustomEvent 'pwa-update-available' – dispatched so SettingsSheet can react
 */
const PWAUpdateNotification: React.FC = () => {
  const { t } = useApp();
  const [showDialog, setShowDialog] = useState(false);
  const newWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    // When the new SW takes control, reload to apply update
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    let reg: ServiceWorkerRegistration | null = null;

    const triggerUpdate = () => reg?.update().catch(() => {});

    const handleVisibilityChange = () => { if (!document.hidden) triggerUpdate(); };
    const handleFocus = () => triggerUpdate();
    const handleCustomCheck = () => triggerUpdate();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pwa-check-update', handleCustomCheck);

    navigator.serviceWorker.ready.then((registration) => {
      reg = registration;

      reg.addEventListener('updatefound', () => {
        const newWorker = reg!.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW is ready but waiting — show the dialog
            newWorkerRef.current = newWorker;
            (window as any).__pwaNewWorker = newWorker;
            (window as any).__pwaUpdateAvailable = true;
            setShowDialog(true);
            window.dispatchEvent(new CustomEvent('pwa-update-available'));
          }
        });
      });
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pwa-check-update', handleCustomCheck);
    };
  }, []);

  const handleUpdate = () => {
    newWorkerRef.current?.postMessage({ type: 'SKIP_WAITING' });
    (window as any).__pwaUpdateAvailable = false;
    setShowDialog(false);
  };

  const handleLater = () => {
    // Keep __pwaUpdateAvailable = true so SettingsSheet keeps showing the badge
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog}>
      <DialogContent
        // Prevent closing by clicking the overlay — user must choose
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-sm"
      >
        <DialogHeader>
          <DialogTitle>{t('newVersion')}</DialogTitle>
          <DialogDescription className="pt-1">
            {t('updateDescription')}
            <br /><br />
            {t('updateDescriptionLater')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleLater}>
            {t('updateLater')}
          </Button>
          <Button onClick={handleUpdate}>
            {t('updateNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PWAUpdateNotification;
