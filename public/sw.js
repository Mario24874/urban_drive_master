const CACHE_NAME = 'urban-drive-v2.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/UrbanDrive.png',
  '/assets/marker.png',
  '/favicon.ico',
  // Note: background.jpg is NOT pre-cached due to size (2.28MB)
  // It will be cached on first load via runtime caching
  // Static assets will be cached automatically by Vite PWA plugin
];

// Install service worker.
// DO NOT call self.skipWaiting() here — the new SW must stay in the
// 'installed/waiting' state so PWAUpdateNotification can show the
// persistent update dialog. skipWaiting is only triggered when the
// user explicitly clicks "Actualizar ahora" (SKIP_WAITING message).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and non-GET requests
  if (!event.request.url.startsWith(self.location.origin) ||
      event.request.method !== 'GET') {
    return;
  }

  // ── Navigation requests (index.html): network-first ──────────────────────
  // Always try the network so the browser gets the latest HTML, which in turn
  // loads the latest hashed JS/CSS chunks. Falls back to cache only offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // ── All other requests: cache-first ──────────────────────────────────────
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              const url = event.request.url;
              // Never cache: API calls, maps, Firebase, or Vite JS/CSS chunks.
              // Vite chunks use content-addressable hashes for HTTP cache;
              // SW-caching them causes stale-file crashes on every new deploy.
              if (url.includes('/api/') ||
                  url.includes('mapbox') ||
                  url.includes('firebase') ||
                  url.includes('googleapis') ||
                  (url.includes('/assets/') && url.match(/\.(js|css)(\?|$)/))
              ) {
                return;
              }
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() =>
          caches.match(event.request) ||
          new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        );
      })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

// Handle SKIP_WAITING message from PWAUpdateNotification
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Implement background sync logic here
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from Urban Drive',
    icon: '/assets/UrbanDrive.png',
    badge: '/assets/UrbanDrive.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/assets/marker.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/marker.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Urban Drive', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});