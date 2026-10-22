const CACHE_PREFIX = 'gc2027ii-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = CACHE_PREFIX + 'v2.9.9';
const SHELL = ['./', './index.html', './battle-core.js', './effect-engine.js', './priority-engine.js', './turn-order-effects.js', './rank-effects.js', './critical-effects.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const shellUrls = SHELL.map(path => new URL(path, self.registration.scope).href);
  if (request.mode !== 'navigate' && !shellUrls.includes(url.href)) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {}));
    }
    return response;
  }).catch(async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const index = await cache.match(new URL('./index.html', self.registration.scope).href);
      if (index) return index;
    }
    return Response.error();
  }));
});
