// Service Worker pour Citrine Management - Pusher Beams & Support Hors-Ligne (PWA)
try {
  importScripts('https://js.pusher.com/beams/service-worker.js');
} catch (err) {
  console.warn('[SW] Pusher Beams script load notice:', err);
}

const CACHE_NAME = 'citrine-v5';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            cache.add(asset).catch(() => undefined)
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (
    url.protocol.startsWith('chrome-extension') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('pusher') ||
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
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          return fallback || Response.error();
        })
    );
    return;
  }

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
        return cached || Response.error();
      })
  );
});

// Écouteur push secondaire pour payloads non-Beams uniquement (évite toute double notification Pusher Beams)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let parsed = null;
  try {
    parsed = event.data.json();
  } catch {
    parsed = { body: event.data.text() };
  }

  // Si c'est une notification Pusher Beams, le script Beams importé la gère déjà nativement.
  if (parsed && (parsed.data?.pusher || parsed.pusher || parsed.notification)) {
    return;
  }

  const payload = {
    title: parsed?.title || 'Citrine Management',
    body: parsed?.body || 'Nouvelle notification administrative.',
    icon: parsed?.icon || '/pwa-192x192.png',
    badge: parsed?.badge || '/pwa-192x192.png',
    tag: parsed?.tag || 'citrine-alert',
    url: parsed?.url || '/',
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      renotify: true,
      vibrate: [100, 50, 100],
      data: { url: payload.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  // Laisser Pusher Beams gérer le clic si le payload provient de Beams
  if (event.notification?.data?.pusher) {
    return;
  }

  event.notification.close();
  if (event.action === 'fermer') return;

  const rawTarget = event.notification.data?.url || event.notification.data?.link || '/';
  const targetUrl = new URL(rawTarget.startsWith('#') ? `/${rawTarget}` : rawTarget, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          await client.focus();
          if ('postMessage' in client) {
            client.postMessage({
              type: 'NAVIGATE_TO',
              url: targetUrl,
              link: event.notification.data?.link || rawTarget,
              action: event.action,
            });
          }
          if ('navigate' in client && client.url !== targetUrl) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
