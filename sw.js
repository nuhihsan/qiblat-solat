// Offline support: the app shell is served from cache and refreshed in the background.
// Prayer-time API calls go to the network first and fall back to the last saved copy.
const CACHE = 'prayer-app-v8';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png', './guide.js'];

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
