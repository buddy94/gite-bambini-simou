/* ── Guida di Simöu ─────────────────────────────────────────────
   Sito statico data-driven: tutto arriva da data/activities.json.
   Per aggiungere un'attività basta una voce in quel file.
   ──────────────────────────────────────────────────────────────── */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const DIFFS = ['facile', 'moderato', 'impegnativo', 'alpinistico'];
const SEASONS = ['primavera', 'estate', 'autunno', 'inverno'];
const SEASON_EMOJI = { primavera: '🌱', estate: '☀️', autunno: '🍂', inverno: '❄️' };
const SORTS = {
  drive: 'Vicinanza',
  rating: 'Valutazione',
  difficulty: 'Difficoltà',
  name: 'Nome',
};
const KIND_COLOR = {
  sentiero: '#4a7c59', acqua: '#2563eb', animali: '#b45309', cultura: '#6d28d9',
  avventura: '#db2777', arrampicata: '#c2410c', alpinismo: '#b91c1c', capanna: '#0f766e',
  bici: '#0284c7', gusto: '#a16207', pioggia: '#475569', inverno: '#0891b2',
};

let DATA = null;
let map = null;
let markerLayer = null;

const state = {
  q: '',
  ages: new Set(),
  kinds: new Set(),
  diffs: new Set(),
  seasons: new Set(),
  maxDrive: 45,
  sort: 'drive',
  favOnly: false,
  view: 'cards',
};

const favs = {
  key: 'simou:favs',
  set: new Set(JSON.parse(localStorage.getItem('simou:favs') || '[]')),
  has(id) { return this.set.has(id); },
  toggle(id) {
    this.set.has(id) ? this.set.delete(id) : this.set.add(id);
    localStorage.setItem(this.key, JSON.stringify([...this.set]));
  },
};

/* ── Tema ─────────────────────────────────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem('simou:theme');
  const dark = saved ? saved === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(dark);
  $('#themeBtn').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme !== 'dark');
  });
}
function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  localStorage.setItem('simou:theme', dark ? 'dark' : 'light');
  $('#themeBtn').textContent = dark ? '☀️' : '🌙';
  $('meta[name="theme-color"]').content = dark ? '#15171a' : '#1a3c2a';
}

/* ── Avvio ────────────────────────────────────────────────────── */
async function init() {
  initTheme();
  try {
    const res = await fetch('data/activities.json');
    if (!res.ok) throw new Error(res.status);
    DATA = await res.json();
  } catch (err) {
    $('#results').innerHTML =
      '<p class="empty">Non riesco a caricare i dati delle attività. ' +
      'Ricarica la pagina quando hai rete.</p>';
    console.error(err);
    return;
  }

  buildChips();
  buildHeroStats();
  bindControls();
  readUrl();
  render();
  registerSW();
}

function buildHeroStats() {
  const a = DATA.activities;
  const near = a.filter(x => x.drive.min <= 25).length;
  $('#heroStats').innerHTML = [
    `📍 ${a.length} attività`,
    `⏱️ ${near} entro 25 min`,
    `🥾 ${a.filter(x => x.kind === 'sentiero').length} sentieri`,
    `🧗 ${a.filter(x => ['arrampicata', 'alpinismo'].includes(x.kind)).length} arrampicata e alpinismo`,
    `👨‍👩‍👧 3 fasce d'età`,
  ].map(t => `<li>${t}</li>`).join('');
  $('#updated').textContent = DATA.meta.updated;
}

function buildChips() {
  const kinds = DATA.meta.kinds;
  $('#kindChips').innerHTML = Object.entries(kinds).map(([k, v]) =>
    chipHtml(k, `${v.emoji} ${v.label}`)).join('');
  $('#diffChips').innerHTML = DIFFS.map(d =>
    chipHtml(d, d[0].toUpperCase() + d.slice(1))).join('');
  $('#seasonChips').innerHTML = SEASONS.map(s =>
    chipHtml(s, `${SEASON_EMOJI[s]} ${s[0].toUpperCase() + s.slice(1)}`)).join('');
  $('#sortChips').innerHTML = Object.entries(SORTS).map(([k, label]) =>
    `<button class="chip" type="button" data-sort="${k}" aria-pressed="${state.sort === k}">${label}</button>`
  ).join('');

  $$('.age-count').forEach(el => {
    const age = el.dataset.count;
    el.textContent = `${DATA.activities.filter(a => a.ages.includes(age)).length} attività`;
  });
}
const chipHtml = (val, label) =>
  `<button class="chip" type="button" data-val="${val}" aria-pressed="false">${label}</button>`;

/* ── Controlli ────────────────────────────────────────────────── */
function bindControls() {
  $('#q').addEventListener('input', e => { state.q = e.target.value.trim(); render(); });

  $$('.age-card').forEach(btn => {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      toggleSet(state.ages, btn.dataset.age);
      btn.setAttribute('aria-pressed', state.ages.has(btn.dataset.age));
      render();
    });
  });

  bindChipGroup('#kindChips', state.kinds);
  bindChipGroup('#diffChips', state.diffs);
  bindChipGroup('#seasonChips', state.seasons);

  $('#sortChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.sort = chip.dataset.sort;
    $$('#sortChips .chip').forEach(c =>
      c.setAttribute('aria-pressed', c.dataset.sort === state.sort));
    render();
  });

  $('#drive').addEventListener('input', e => {
    state.maxDrive = +e.target.value;
    $('#driveVal').textContent = state.maxDrive >= 70 ? 'senza limite' : `${state.maxDrive} min`;
    render();
  });

  $('#favBtn').addEventListener('click', e => {
    state.favOnly = !state.favOnly;
    e.currentTarget.setAttribute('aria-pressed', state.favOnly);
    render();
  });

  $('#clearBtn').addEventListener('click', resetFilters);

  $$('.vt').forEach(btn => btn.addEventListener('click', () => {
    state.view = btn.dataset.view;
    $$('.vt').forEach(b => b.classList.toggle('active', b === btn));
    render();
  }));

  $('#detailClose').addEventListener('click', () => $('#detail').close());
  $('#detail').addEventListener('close', () => {
    if (location.hash.startsWith('#a/')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  });
  $('#detail').addEventListener('click', e => {
    if (e.target === $('#detail')) $('#detail').close();   // click sul backdrop
  });
  addEventListener('hashchange', readUrl);
}

function bindChipGroup(sel, set) {
  $(sel).addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    toggleSet(set, chip.dataset.val);
    chip.setAttribute('aria-pressed', set.has(chip.dataset.val));
    render();
  });
}
const toggleSet = (set, v) => set.has(v) ? set.delete(v) : set.add(v);

function resetFilters() {
  state.q = '';
  state.ages.clear(); state.kinds.clear(); state.diffs.clear(); state.seasons.clear();
  state.maxDrive = 45; state.sort = 'drive'; state.favOnly = false;
  $('#q').value = '';
  $('#drive').value = 45;
  $('#driveVal').textContent = '45 min';
  $('#favBtn').setAttribute('aria-pressed', 'false');
  $$('.age-card, .chip').forEach(el => el.setAttribute('aria-pressed', 'false'));
  $$('#sortChips .chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.sort === 'drive'));
  render();
}

/* ── Filtro + ordinamento ─────────────────────────────────────── */
function filtered() {
  const q = state.q.toLowerCase();
  const list = DATA.activities.filter(a => {
    if (state.maxDrive < 70 && a.drive.min > state.maxDrive) return false;
    if (state.ages.size && !a.ages.some(x => state.ages.has(x))) return false;
    if (state.kinds.size && !state.kinds.has(a.kind)) return false;
    if (state.diffs.size && !state.diffs.has(a.difficulty)) return false;
    if (state.seasons.size && !a.season.some(s => state.seasons.has(s))) return false;
    if (state.favOnly && !favs.has(a.id)) return false;
    if (q) {
      const hay = [a.title, a.why, a.desc, a.drive.to, ...(a.tags || [])]
        .join(' ').toLowerCase();
      if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
    }
    return true;
  });

  const cmp = {
    drive: (a, b) => a.drive.min - b.drive.min || b.rating - a.rating,
    rating: (a, b) => b.rating - a.rating || a.drive.min - b.drive.min,
    difficulty: (a, b) => DIFFS.indexOf(a.difficulty) - DIFFS.indexOf(b.difficulty)
      || a.drive.min - b.drive.min,
    name: (a, b) => a.title.localeCompare(b.title, 'it'),
  }[state.sort];
  return list.sort(cmp);
}

const activeFilterCount = () =>
  state.kinds.size + state.diffs.size + state.seasons.size;

/* ── Render ───────────────────────────────────────────────────── */
function render() {
  const list = filtered();
  const n = activeFilterCount();
  $('#activeCount').textContent = n ? n : '';
  $('#count').innerHTML = `<strong>${list.length}</strong> attività` +
    (state.maxDrive < 70 ? ` entro ${state.maxDrive} min di auto` : '');
  $('#empty').hidden = list.length > 0;

  const cards = $('#results'), mapEl = $('#map');
  if (state.view === 'map') {
    cards.hidden = true; mapEl.hidden = false;
    renderMap(list);
  } else {
    mapEl.hidden = true; cards.hidden = false;
    renderCards(list);
  }
  syncUrl();
}

function renderCards(list) {
  const box = $('#results');
  if (!list.length) { box.innerHTML = ''; return; }

  let html = '';
  if (state.sort === 'drive') {
    const bands = [
      { max: 15, label: 'Dietro casa', hint: 'fino a 15 minuti' },
      { max: 25, label: 'Un salto', hint: '15-25 minuti' },
      { max: 40, label: 'Mezza giornata', hint: '25-40 minuti' },
      { max: Infinity, label: 'Giornata intera', hint: 'oltre 40 minuti' },
    ];
    let prev = -1;
    for (const band of bands) {
      const chunk = list.filter(a => a.drive.min > prev && a.drive.min <= band.max);
      prev = band.max;
      if (!chunk.length) continue;
      html += `<div class="group-head"><h2>${band.label}</h2><span>${band.hint} · ${chunk.length}</span></div>`;
      html += chunk.map(cardHtml).join('');
    }
  } else {
    html = list.map(cardHtml).join('');
  }
  box.innerHTML = html;

  box.onclick = e => {
    const fav = e.target.closest('.fav');
    if (fav) {
      e.stopPropagation();
      favs.toggle(fav.dataset.id);
      fav.textContent = favs.has(fav.dataset.id) ? '★' : '☆';
      if (state.favOnly) render();
      return;
    }
    const card = e.target.closest('.card');
    if (card) openDetail(card.dataset.id);
  };
  box.onkeydown = e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.card');
    if (!card) return;
    e.preventDefault();
    openDetail(card.dataset.id);
  };
}

function cardHtml(a) {
  const img = a.images && a.images[0];
  const kind = DATA.meta.kinds[a.kind];
  const s = a.stats || {};
  const bits = [];
  if (s.km) bits.push(`<span><b>${fmtKm(s.km)}</b></span>`);
  if (s.up) bits.push(`<span>⛰️ <b>${Math.abs(s.up)} m</b></span>`);
  if (s.time) bits.push(`<span>⏱️ <b>${s.time}</b></span>`);
  if (s.alt) bits.push(`<span>📍 ${s.alt}</span>`);

  return `
  <article class="card${a.featured ? ' featured' : ''}" data-id="${a.id}" tabindex="0">
    <button class="fav" data-id="${a.id}" type="button"
            aria-label="Preferito">${favs.has(a.id) ? '★' : '☆'}</button>
    ${img
      ? `<div class="card-thumb"><img src="${img}" alt="" loading="lazy" decoding="async"
           onerror="this.parentElement.classList.add('no-img');this.remove()"></div>`
      : `<div class="card-thumb no-img">${a.emoji}</div>`}
    <div class="card-body">
      <h3>${a.title}</h3>
      <div class="card-meta">
        <span class="pill pill-drive${a.drive.min > 40 ? ' far' : ''}">🚗 ${a.drive.min} min</span>
        <span class="pill pill-${a.difficulty}">${a.difficulty}</span>
        <span class="pill pill-rating">${kind.emoji} ${kind.label}</span>
        ${a.rating ? `<span class="pill pill-rating">★ ${a.rating.toFixed(1)}</span>` : ''}
      </div>
      <p class="why">${a.why}</p>
      ${bits.length ? `<div class="card-stats">${bits.join('')}</div>` : ''}
    </div>
  </article>`;
}

const fmtKm = km => km < 1 ? `${Math.round(km * 1000)} m` : `${String(km).replace('.', ',')} km`;

/* ── Dettaglio ────────────────────────────────────────────────── */
function openDetail(id) {
  const a = DATA.activities.find(x => x.id === id);
  if (!a) return;
  const kind = DATA.meta.kinds[a.kind];
  const s = a.stats || {};
  const o = DATA.meta.origin;

  const facts = [
    ['In auto', `${a.drive.min} min · ${String(a.drive.km).replace('.', ',')} km`],
    ['Verso', a.drive.to],
    s.km ? ['Lunghezza', fmtKm(s.km)] : null,
    s.up ? ['Dislivello', `${Math.abs(s.up)} m${s.up < 0 ? ' ↓' : ''}`] : null,
    s.time ? ['Durata', s.time] : null,
    s.alt ? ['Quota', s.alt] : null,
    s.type ? ['Percorso', s.type] : null,
    ['Difficoltà', a.difficulty],
  ].filter(Boolean);

  const gmaps = 'https://www.google.com/maps/dir/?api=1' +
    `&origin=${o.lat},${o.lon}&destination=${a.lat},${a.lon}&travelmode=driving`;
  const links = [
    { label: '🗺️ Indicazioni da Simöu', url: gmaps, primary: true },
    ...(a.links || []).map(l => ({ label: linkLabel(l), url: l.url })),
  ];

  $('#detailBody').innerHTML = `
    ${a.images && a.images[0]
      ? `<div class="d-hero"><img src="${a.images[0]}" alt="" onerror="this.parentElement.remove()"></div>` : ''}
    <div class="d-body">
      <h2>${a.emoji} ${a.title}</h2>
      <div class="d-meta">
        <span class="pill pill-drive${a.drive.min > 40 ? ' far' : ''}">🚗 ${a.drive.min} min</span>
        <span class="pill pill-${a.difficulty}">${a.difficulty}</span>
        <span class="pill pill-rating">${kind.emoji} ${kind.label}</span>
        ${a.rating ? `<span class="pill pill-rating">★ ${a.rating.toFixed(1)}</span>` : ''}
        ${a.ages.map(x => `<span class="pill pill-rating">${DATA.meta.ages[x].emoji} ${DATA.meta.ages[x].label}</span>`).join('')}
      </div>
      <p class="d-why">${a.why}</p>
      <p class="desc">${a.desc}</p>
      <dl class="d-grid">
        ${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
      </dl>
      ${a.warn ? `<p class="d-warn">⚠️ ${a.warn}</p>` : ''}
      <div class="d-meta">
        <span class="pill pill-rating">Stagione: ${a.season.map(x => SEASON_EMOJI[x] + ' ' + x).join(' · ')}</span>
      </div>
      ${a.tags && a.tags.length
        ? `<div class="d-tags">${a.tags.map(t => `<span>${t}</span>`).join('')}</div>` : ''}
      <div class="d-links">
        ${links.map(l => `<a href="${l.url}" target="_blank" rel="noopener"${l.primary ? ' class="primary"' : ''}>${l.label}</a>`).join('')}
      </div>
    </div>`;

  history.replaceState(null, '', `#a/${a.id}`);
  const dlg = $('#detail');
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}

function linkLabel(l) {
  const icons = { alltrails: '🥾', info: '📖', web: '🌐' };
  return `${icons[l.kind] || '🔗'} ${l.label}`;
}

/* ── Mappa ────────────────────────────────────────────────────── */
function renderMap(list) {
  if (!window.L) {
    $('#map').innerHTML = '<p class="empty">Mappa non disponibile: manca la rete.</p>';
    return;
  }
  const o = DATA.meta.origin;
  if (!map) {
    map = L.map('map', { scrollWheelZoom: false }).setView([o.lat, o.lon], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    L.marker([o.lat, o.lon], { icon: pin('🏠', '#1a3c2a'), zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<div class="pop"><h4>🏠 Simöu</h4><p>La casetta. Tutti i tempi partono da qui.</p></div>');
  }
  markerLayer.clearLayers();

  const pts = [[o.lat, o.lon]];
  list.forEach(a => {
    pts.push([a.lat, a.lon]);
    L.marker([a.lat, a.lon], { icon: pin(a.emoji, KIND_COLOR[a.kind] || '#4a7c59') })
      .addTo(markerLayer)
      .bindPopup(`<div class="pop"><h4>${a.title}</h4>
        <p>🚗 ${a.drive.min} min · ${a.difficulty}${a.rating ? ` · ★ ${a.rating.toFixed(1)}` : ''}</p>
        <button type="button" onclick="openDetail('${a.id}')">Dettagli</button></div>`);
  });
  if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(0.12));
  setTimeout(() => map.invalidateSize(), 60);
}

const pin = (emoji, color) => L.divIcon({
  className: '',
  html: `<div class="marker-pin" style="background:${color}"><span>${emoji}</span></div>`,
  iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28],
});

/* ── URL ──────────────────────────────────────────────────────── */
function syncUrl() {
  if (location.hash.startsWith('#a/')) return;   // il dettaglio ha la precedenza
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.ages.size) p.set('eta', [...state.ages].join(','));
  if (state.kinds.size) p.set('tipo', [...state.kinds].join(','));
  if (state.diffs.size) p.set('diff', [...state.diffs].join(','));
  if (state.seasons.size) p.set('stag', [...state.seasons].join(','));
  if (state.maxDrive !== 45) p.set('auto', state.maxDrive);
  if (state.sort !== 'drive') p.set('ord', state.sort);
  if (state.favOnly) p.set('fav', '1');
  if (state.view !== 'cards') p.set('vista', state.view);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

function readUrl() {
  const p = new URLSearchParams(location.search);
  const fill = (key, set, sel, attr) => {
    const v = p.get(key);
    if (!v) return;
    v.split(',').forEach(x => set.add(x));
    $$(sel).forEach(c => c.setAttribute('aria-pressed', set.has(c.dataset[attr])));
  };
  if (p.get('q')) { state.q = p.get('q'); $('#q').value = state.q; }
  fill('eta', state.ages, '.age-card', 'age');
  fill('tipo', state.kinds, '#kindChips .chip', 'val');
  fill('diff', state.diffs, '#diffChips .chip', 'val');
  fill('stag', state.seasons, '#seasonChips .chip', 'val');
  if (p.get('auto')) {
    state.maxDrive = +p.get('auto');
    $('#drive').value = state.maxDrive;
    $('#driveVal').textContent = state.maxDrive >= 70 ? 'senza limite' : `${state.maxDrive} min`;
  }
  if (SORTS[p.get('ord')]) {
    state.sort = p.get('ord');
    $$('#sortChips .chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.sort === state.sort));
  }
  if (p.get('fav')) { state.favOnly = true; $('#favBtn').setAttribute('aria-pressed', 'true'); }
  if (p.get('vista') === 'map') {
    state.view = 'map';
    $$('.vt').forEach(b => b.classList.toggle('active', b.dataset.view === 'map'));
  }
  if (activeFilterCount()) $('#moreFilters').open = true;

  const m = location.hash.match(/^#a\/(.+)$/);
  if (m && DATA) openDetail(decodeURIComponent(m[1]));
}

/* ── Offline ──────────────────────────────────────────────────── */
function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline è opzionale */ });
}

window.openDetail = openDetail;   // usato dai popup della mappa
init();
