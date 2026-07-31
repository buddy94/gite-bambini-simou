/* Service worker minimale: la guida resta leggibile anche senza rete.
   In valle il segnale non c'è ovunque, ed è proprio lì che serve.
   Le tile della mappa NON sono in cache: la mappa richiede rete. */
const CACHE = 'simou-v1';
const SHELL = [
  './',
  './index.html',
  './css/main.css',
  './js/main.js',
  './data/activities.json',
  './favicon.svg',
  './manifest.webmanifest',
];

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
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // network-first: online si vede sempre la versione aggiornata,
  // offline si ricade sulla copia in cache.
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
