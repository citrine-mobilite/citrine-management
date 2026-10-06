// Service Worker pour Citrine Management - Notifications Push & Support Hors-Ligne (PWA)
const CACHE_NAME = 'citrine-v3';

self.addEventListener('install', (event) => {
  // Force active immediately without waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Purge old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Écouteur des requêtes réseau avec stratégie Network-First pour HTML et Stale-While-Revalidate pour assets
self.addEventListener('fetch', (event) => {
  // Seules les requêtes GET sont éligibles
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // Ignorer les requêtes Chrome Extension, dev modules Vite et Firebase/API externes
  if (
    url.protocol.startsWith('chrome-extension') || 
    url.hostname.includes('firestore') || 
    url.hostname.includes('googleapis') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('node_modules') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('@fs') ||
    url.searchParams.has('import') ||
    url.searchParams.has('v')
  ) {
    return;
  }

  // 1. Navigation / HTML Requests: ALWAYS Network-First (so new hashed assets are never out of sync)
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(event.request).then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // 2. Static Assets: Network-First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        throw new Error('Offline and not in cache');
      })
  );
});

// Écouteur pour les événements de push natifs (Web Push API)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Citrine Management',
    body: 'Nouvelle notification administrative.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'citrine-alert'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    tag: payload.tag || 'citrine-alert',
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Écouteur pour le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Ouvre l'application ou la met au premier plan
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const urlToOpen = event.notification.data?.url || '/';
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Écouteur de messages envoyés depuis l'application cliente (pour déclencher des notifications système en arrière-plan)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload || {};
    if (title) {
      const notifOptions = {
        body: options?.body || 'Nouvelle notification Citrine',
        icon: options?.icon || '/pwa-192x192.png',
        badge: options?.badge || '/pwa-192x192.png',
        tag: options?.tag || 'citrine-push-' + Date.now(),
        renotify: true,
        vibrate: [200, 100, 200],
        data: {
          url: options?.url || '/'
        },
        ...options
      };
      self.registration.showNotification(title, notifOptions);
    }
  }
});

