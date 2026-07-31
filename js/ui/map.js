/* Mappa Leaflet. Caricata solo quando serve: la libreria e le tile pesano,
   e chi apre la guida per leggere le schede non deve pagarle. */

import { KIND_COLOR } from '../config.js';
import { $ } from './dom.js';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

let map = null;
let layer = null;
let origin = null;
let loading = null;

export function initMap(meta) {
  origin = meta.origin;
}

/** Disegna i pin delle attività passate. Carica Leaflet al primo uso. */
export async function renderMap(list, onOpen) {
  try {
    await ensureLeaflet();
  } catch {
    $('#map').innerHTML =
      '<p class="empty">La mappa ha bisogno della rete. Le schede funzionano lo stesso.</p>';
    return;
  }

  if (!map) create(onOpen);
  layer.clearLayers();

  const points = [[origin.lat, origin.lon]];
  for (const a of list) {
    points.push([a.lat, a.lon]);
    L.marker([a.lat, a.lon], { icon: pin(a.emoji, KIND_COLOR[a.kind] || '#4a7c59') })
      .addTo(layer)
      .bindPopup(popup(a));
  }

  if (points.length > 1) map.fitBounds(L.latLngBounds(points).pad(0.12));
  // il contenitore era nascosto quando Leaflet ha misurato: va rimisurato
  setTimeout(() => map.invalidateSize(), 60);
}

function create(onOpen) {
  map = L.map('map', { scrollWheelZoom: false }).setView([origin.lat, origin.lon], 11);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  layer = L.layerGroup().addTo(map);

  L.marker([origin.lat, origin.lon], { icon: pin('🏠', '#1a3c2a'), zIndexOffset: 1000 })
    .addTo(map)
    .bindPopup(`<div class="pop"><h4>🏠 ${origin.name}</h4>
      <p>La casetta. Tutti i tempi partono da qui.</p></div>`);

  // delega invece di onclick inline: il popup è HTML generato, non codice
  map.getContainer().addEventListener('click', e => {
    const btn = e.target.closest('[data-open]');
    if (btn) onOpen(btn.dataset.open);
  });
}

const popup = a => `<div class="pop">
  <h4>${a.emoji} ${a.title}</h4>
  <p>🚗 ${a.drive.min} min · ${a.difficulty}${a.rating ? ` · ★ ${a.rating.toFixed(1)}` : ''}</p>
  <button type="button" data-open="${a.id}">Dettagli</button>
</div>`;

const pin = (emoji, color) => L.divIcon({
  className: '',
  html: `<div class="marker-pin" style="background:${color}"><span>${emoji}</span></div>`,
  iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28],
});

/* ── Caricamento pigro di Leaflet ─────────────────────────────── */
function ensureLeaflet() {
  if (window.L) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET_CSS;
    document.head.appendChild(css);

    const js = document.createElement('script');
    js.src = LEAFLET_JS;
    js.onload = resolve;
    js.onerror = () => reject(new Error('Leaflet non raggiungibile'));
    document.head.appendChild(js);
  });
  return loading;
}
