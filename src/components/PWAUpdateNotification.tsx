import { useEffect } from 'react';
import { toast } from 'sonner';

const PWAUpdateNotification: React.FC = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    // When a new SW takes control, reload the page
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    // Listen for messages from the SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'OFFLINE_READY') {
        toast.success('App ready to work offline', {
          description: 'The app now works without internet connection',
          duration: 5000,
        });
      }
    });

    let reg: ServiceWorkerRegistration | null = null;

    const triggerUpdate = () => {
      reg?.update().catch(() => {});
    };

    // Force-check for updates when the tab becomes visible or window regains focus
    const handleVisibilityChange = () => {
      if (!document.hidden) triggerUpdate();
    };
    const handleFocus = () => triggerUpdate();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Custom event dispatched by SettingsSheet "Check for updates" button
    const handleCustomCheck = () => triggerUpdate();
    window.addEventListener('pwa-check-update', handleCustomCheck);

    navigator.serviceWorker.ready.then((registration) => {
      reg = registration;

      reg.addEventListener('updatefound', () => {
        const newWorker = reg!.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW installed and an old one is already controlling the page
            toast.info('New version available', {
              description: 'Update to get the latest features',
              duration: Infinity,
              action: {
                label: 'Update',
                onClick: () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                },
              },
            });
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

  return null;
};

export default PWAUpdateNotification;
