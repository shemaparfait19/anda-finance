const CACHE_NAME = 'anda-finance-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'ANDA Finance', body: event.data.text() }; }

  const title = data.title || 'ANDA Finance';
  const options = {
    body: data.body || '',
    icon: '/api/icons/192',
    badge: '/api/icons/96',
    data: { url: data.url || '/member/dashboard' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    tag: 'anda-notification',  // replace older notification instead of stacking
    renotify: true,
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Increment badge on app icon (supported on Android + some desktop)
      self.registration.getNotifications().then((notifs) => {
        const count = notifs.length + 1;
        if (navigator.setAppBadge) navigator.setAppBadge(count).catch(() => {});
      }),
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/member/dashboard';

  // Clear badge when user taps the notification
  if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes('/member'));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});

// Message from app to update badge count
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_BADGE') {
    const count = event.data.count || 0;
    if (count > 0) {
      if (navigator.setAppBadge) navigator.setAppBadge(count).catch(() => {});
    } else {
      if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
    }
  }
});
