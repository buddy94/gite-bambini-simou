/* Service worker: la guida resta leggibile anche senza rete.
   In valle il segnale non c'è ovunque, ed è proprio lì che serve.

   I file di dati non sono elencati a mano: si leggono da data/index.json in
   fase di installazione, così aggiungere un file tematico non richiede di
   ricordarsi di aggiornare anche questo elenco.

   Le tile della mappa e Leaflet NON sono in cache: la mappa richiede rete. */

const CACHE = 'simou-v5';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './assets/logo-96.png',
  './assets/logo-192.png',
  './css/base.css',
  './css/layout.css',
  './css/cards.css',
  './css/detail.css',
  './css/map.css',
  './css/favorites.css',
  './js/main.js',
  './js/config.js',
  './js/data.js',
  './js/store.js',
  './js/filters.js',
  './js/url.js',
  './js/ui/dom.js',
  './js/ui/theme.js',
  './js/ui/controls.js',
  './js/ui/cards.js',
  './js/ui/detail.js',
  './js/ui/map.js',
  './js/ui/favorites.js',
];

self.addEventListener('install', event => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

async function precache() {
  const cache = await caches.open(CACHE);
  const files = [...SHELL, './data/index.json'];

  try {
    const manifest = await (await fetch('./data/index.json')).json();
    files.push(`./data/${manifest.meta}`, ...manifest.sources.map(s => `./data/${s}`));
  } catch {
    // manifest non raggiungibile: si installa comunque lo scheletro,
    // i dati verranno messi in cache alla prima visita utile
  }

  // addAll fallisce in blocco se un solo file manca: qui si va uno per uno
  await Promise.all(files.map(f => cache.add(f).catch(() => {})));
}

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  // Rete per prima: online si vede sempre la versione aggiornata,
  // offline si ricade sulla copia in cache.
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request)
        .then(hit => hit || caches.match('./index.html')))
  );
});
