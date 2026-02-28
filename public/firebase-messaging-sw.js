/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// Handles background push notifications (app closed or not in focus)

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD_zQMqs8o3evjEtjkuXybPW-sdH4c573M',
  authDomain: 'urbandrive-1082b.firebaseapp.com',
  projectId: 'urbandrive-1082b',
  storageBucket: 'urbandrive-1082b.appspot.com',
  messagingSenderId: '470229432792',
  appId: '1:470229432792:web:urbandrive',
});

const messaging = firebase.messaging();

// ── Background message handler ─────────────────────────────────────────────────
// Called when the app is NOT in the foreground
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'Urban Drive';
  const body = payload.notification?.body ?? '';
  const contactId = payload.data?.contactId ?? '';

  return self.registration.showNotification(title, {
    body,
    icon: '/assets/UrbanDrive.png',
    badge: '/assets/UrbanDrive.png',
    vibrate: [100, 50, 100],
    tag: `msg-${contactId || 'general'}`,
    renotify: true,
    data: { contactId, ...(payload.data ?? {}) },
  });
});

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const contactId = event.notification.data?.contactId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app is already open, focus it and send a message to open the chat
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if (contactId) {
            client.postMessage({ type: 'OPEN_CHAT', contactId });
          }
          return client.focus();
        }
      }
      // Otherwise open the app
      const url = contactId ? `/?chat=${encodeURIComponent(contactId)}` : '/';
      return clients.openWindow(url);
    })
  );
});
