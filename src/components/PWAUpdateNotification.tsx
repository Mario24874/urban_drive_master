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

    const registration = navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
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
      registration.then(() => {}).catch(() => {});
    };
  }, []);

  return null;
};

export default PWAUpdateNotification;
