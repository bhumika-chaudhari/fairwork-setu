/**
 * FairWork Setu - Service Worker for PWA Offline Resilience & Push Notifications
 * Handles background push alerts, Android TWA / PWA notifications, and deep-link click routing.
 */

const CACHE_NAME = 'setu-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/android-chrome-192x192.png',
  '/notification-badge-72x72.png',
  '/logo.png',
];

// Service Worker Install
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Continue even if initial precache of optional assets fails
      });
    })
  );
});

// Service Worker Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Push Notification Received (Web Push & Android TWA)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'FairWork Setu',
    body: 'Aapke liye Setu par naya update aaya hai.',
    icon: '/android-chrome-192x192.png',
    badge: '/notification-badge-72x72.png',
    data: { url: '/home' },
    tag: 'setu-update',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/android-chrome-192x192.png',
    badge: payload.badge || '/notification-badge-72x72.png',
    tag: payload.tag || 'setu-notification',
    data: payload.data || { url: '/home' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: payload.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// Notification Click -> Deep Link Navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
