// Offline support: the app shell is served from cache and refreshed in the background.
// Prayer-time API calls go to the network first and fall back to the last saved copy.
const CACHE = 'prayer-app-v16';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png', './guide.js', './extras.js', './notes.js', './notify.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Prayer-time API: network first, cached copy if offline
  if (url.hostname === 'api.waktusolat.app' || url.hostname === 'api.alquran.cloud') {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // App files: serve from cache instantly, update the cache in the background
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(CACHE).then(async c => {
        const cached = await c.match(req, { ignoreSearch: true }) ||
                       (req.mode === 'navigate' ? await c.match('./index.html') : null);
        const network = fetch(req).then(res => {
          if (res.ok) c.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});

// Prayer notifications, sent by the Worker in /worker
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Waktu Solat', {
    body: d.body || '', icon: 'icon-180.png', badge: 'icon-180.png', tag: d.tag || undefined, data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => x.url.startsWith(self.registration.scope));
    return c ? c.focus() : self.clients.openWindow(url);
  }));
});
