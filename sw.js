const scope = new URL(self.registration.scope);
const prefix = 'la-primera-' + scope.pathname + '-';
const cacheName = prefix + '35c7eb8a3ea8a21c';
const assets = ["index.html", "icon-192.png", "icon-512.png", "manifest.webmanifest"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets.map((file) => new URL(file, scope)))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith(prefix) && name !== cacheName).map((name) => caches.delete(name)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const target = new URL(request.url);
  if (request.method !== 'GET' || target.origin !== scope.origin || !target.pathname.startsWith(scope.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        const home = target.pathname === scope.pathname || target.pathname === new URL('index.html', scope).pathname;
        return await cache.match(request) || (home && await cache.match(new URL('index.html', scope))) ||
          new Response('Esta edición no se ha guardado para leer sin conexión.', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
      }
    }
    return await cache.match(request) || fetch(request);
  })());
});
