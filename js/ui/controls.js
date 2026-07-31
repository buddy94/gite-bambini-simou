/* Costruzione e binding di tutti i controlli: fasce d'età, ricerca, chip,
   slider del tempo in auto, preferiti, vista. Tutto generato dai dati, così
   una fascia o un tipo nuovo compaiono da soli. */

import { DIFFS, SEASONS, SEASON_EMOJI, SORTS, DRIVE_DEFAULT, DRIVE_MAX } from '../config.js';
import { state, toggleIn, resetState, emit, favs } from '../store.js';
import { secondaryCount } from '../filters.js';
import { $, $$, chip, esc, capitalize } from './dom.js';

let ages = {};

export function buildControls({ meta, activities }) {
  ages = meta.ages;
  buildAges(meta, activities);
  buildChips(meta);
  buildHero(meta, activities);
  bind();
}

/* ── Fasce d'età ──────────────────────────────────────────────── */
function buildAges(meta, activities) {
  $('#ages').innerHTML = Object.entries(meta.ages).map(([id, age]) => `
    <button class="age-card" type="button" data-age="${esc(id)}" aria-pressed="false">
      <span class="age-emoji">${age.emoji}</span>
      <span class="age-name">${esc(age.label)}</span>
      <span class="age-hint">${esc(age.hint)}</span>
      <span class="age-count">${activities.filter(a => a.ages.includes(id)).length} attività</span>
    </button>`).join('');
}

/* ── Chip dei filtri ──────────────────────────────────────────── */
function buildChips(meta) {
  $('#kindChips').innerHTML = Object.entries(meta.kinds)
    .map(([k, v]) => chip(k, `${v.emoji} ${esc(v.label)}`)).join('');
  $('#diffChips').innerHTML = DIFFS.map(d => chip(d, capitalize(d))).join('');
  $('#seasonChips').innerHTML = SEASONS
    .map(s => chip(s, `${SEASON_EMOJI[s]} ${capitalize(s)}`)).join('');
  $('#sortChips').innerHTML = Object.entries(SORTS).map(([k, label]) =>
    `<button class="chip" type="button" data-sort="${k}" ` +
    `aria-pressed="${state.sort === k}">${label}</button>`).join('');
}

/* ── Badge dell'intestazione ──────────────────────────────────── */
function buildHero(meta, activities) {
  const near = activities.filter(a => a.drive.min <= 25).length;
  const vertical = activities.filter(a => ['arrampicata', 'alpinismo'].includes(a.kind)).length;
  $('#heroStats').innerHTML = [
    `📍 ${activities.length} attività`,
    `⏱️ ${near} entro 25 min`,
    `🥾 ${activities.filter(a => a.kind === 'sentiero').length} sentieri`,
    `🧗 ${vertical} arrampicata e alpinismo`,
    `👶 ${Object.keys(meta.ages).length} fasce d'età`,
  ].map(t => `<li>${t}</li>`).join('');
  $('#updated').textContent = meta.updated;
}

/* ── Binding ──────────────────────────────────────────────────── */
function bind() {
  $('#q').addEventListener('input', e => {
    state.q = e.target.value.trim();
    emit();
  });

  $('#ages').addEventListener('click', e => {
    const btn = e.target.closest('.age-card');
    if (!btn) return;
    btn.setAttribute('aria-pressed', toggleIn(state.ages, btn.dataset.age));
    paintAgeHint();
    emit();
  });

  bindChipGroup('#kindChips', state.kinds);
  bindChipGroup('#diffChips', state.diffs);
  bindChipGroup('#seasonChips', state.seasons);

  $('#sortChips').addEventListener('click', e => {
    const c = e.target.closest('.chip');
    if (!c) return;
    state.sort = c.dataset.sort;
    $$('#sortChips .chip').forEach(x =>
      x.setAttribute('aria-pressed', x.dataset.sort === state.sort));
    emit();
  });

  $('#drive').addEventListener('input', e => {
    state.maxDrive = +e.target.value;
    paintDrive();
    emit();
  });

  $('#clearBtn').addEventListener('click', () => {
    resetState();
    syncControls();
    emit();
  });

  $('#viewToggle').addEventListener('click', e => {
    const btn = e.target.closest('.vt');
    if (!btn) return;
    state.view = btn.dataset.view;
    // uscire dalla vista preferiti scarta la lista condivisa che si stava guardando
    if (state.view !== 'favs') state.sharedList = null;
    emit();   // il render ridipinge il selettore
  });
}

function bindChipGroup(sel, set) {
  $(sel).addEventListener('click', e => {
    const c = e.target.closest('.chip');
    if (!c) return;
    c.setAttribute('aria-pressed', toggleIn(set, c.dataset.val));
    emit();
  });
}

/** Il contatore sul pulsante Preferiti. */
export function paintFavCount() {
  const el = $('#favCount');
  // su mobile è un bollino sull'icona, su desktop testo accanto all'etichetta
  const compact = matchMedia('(max-width: 700px)').matches;
  el.textContent = favs.size ? (compact ? String(favs.size) : `(${favs.size})`) : '';
}

/* Quale vista è evidenziata. Va rifatto a ogni render e non solo al clic:
   la vista si cambia anche da dentro le viste stesse (dal link condiviso,
   dal pulsante della lista vuota) e da un link con ?vista=. */
export function paintView() {
  $$('.vt').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
}

/* Su mobile le card delle fasce sono strette e la descrizione non ci sta:
   quella delle fasce scelte compare sotto la riga. Su schermi larghi
   l'elemento resta nascosto, la descrizione è già dentro ogni card. */
function paintAgeHint() {
  const el = $('#ageHint');
  const hints = [...state.ages].map(id => ages[id]?.hint).filter(Boolean);
  el.textContent = hints.join(' ');
  el.hidden = !hints.length;
}

/** Riallinea i controlli allo stato: dopo un reset o una lettura dall'URL. */
export function syncControls() {
  $('#q').value = state.q;
  $('#drive').value = state.maxDrive;
  paintDrive();
  $$('.age-card').forEach(b => b.setAttribute('aria-pressed', state.ages.has(b.dataset.age)));
  paintChips('#kindChips', state.kinds);
  paintChips('#diffChips', state.diffs);
  paintChips('#seasonChips', state.seasons);
  $$('#sortChips .chip').forEach(c =>
    c.setAttribute('aria-pressed', c.dataset.sort === state.sort));
  paintAgeHint();
  paintView();
  paintFavCount();

  // Su schermo largo il pannello parte aperto: lo spazio c'è e il tempo in
  // auto è il filtro che conta di più, non va nascosto dietro un clic. Su
  // mobile resta chiuso, lì ogni riga in cima è una scheda in meno visibile.
  $('#moreFilters').open = wide() || secondaryCount() > 0;
}

const wide = () => matchMedia('(min-width: 701px)').matches;

const paintChips = (sel, set) =>
  $$(`${sel} .chip`).forEach(c => c.setAttribute('aria-pressed', set.has(c.dataset.val)));

function paintDrive() {
  $('#driveVal').textContent =
    state.maxDrive >= DRIVE_MAX ? 'senza limite' : `${state.maxDrive} min`;
}

export { DRIVE_DEFAULT };
