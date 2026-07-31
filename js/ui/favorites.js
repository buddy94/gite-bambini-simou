/* Vista "Preferiti": la lista delle attività salvate, riordinabile.

   Il riordino usa i Pointer Events invece dell'API drag-and-drop di HTML5,
   che sul telefono non funziona. Così la stessa implementazione copre mouse,
   dito e penna. C'è anche il riordino da tastiera, perché trascinare non è
   un'opzione per tutti. */

import { SEASON_EMOJI, DRIVE_FAR } from '../config.js';
import { favs, state, emit } from '../store.js';
import { $, esc } from './dom.js';

let meta = null;
let activities = [];
let onOpen = () => {};

export function initFavorites(data, openDetail) {
  meta = data.meta;
  activities = data.activities;
  onOpen = openDetail;

  const box = $('#favs');
  box.addEventListener('click', onClick);
  box.addEventListener('keydown', onKeydown);
  box.addEventListener('pointerdown', onPointerDown);
}

const byId = id => activities.find(a => a.id === id);

/* ── Render ───────────────────────────────────────────────────── */

export function renderFavorites() {
  const shared = state.sharedList;
  const ids = shared || favs.list();
  const items = ids.map(byId).filter(Boolean);
  const missing = ids.length - items.length;

  $('#favs').innerHTML = items.length
    ? head(items, shared, missing) + list(items, !shared) + foot(shared)
    : empty(shared);
}

function head(items, shared, missing) {
  const drive = items.reduce((sum, a) => sum + a.drive.min, 0);
  const far = items.filter(a => a.drive.min > DRIVE_FAR).length;
  const seasons = new Set(items.flatMap(a => a.season));

  return `
    ${shared ? `<div class="fv-shared">
      <p><strong>Lista condivisa.</strong> Non sono i tuoi preferiti: qualcuno
      ti ha mandato questa selezione di ${items.length} attività.</p>
      <div class="fv-shared-act">
        <button class="fv-btn primary" data-act="import" type="button">Aggiungi ai miei preferiti</button>
        <button class="fv-btn" data-act="dismiss" type="button">Torna ai miei</button>
      </div>
    </div>` : ''}

    <div class="fv-head">
      <div class="fv-sum">
        <div><b>${items.length}</b><span>${items.length === 1 ? 'attività' : 'attività'}</span></div>
        <div><b>${fmtMinutes(drive)}</b><span>di auto in tutto</span></div>
        <div><b>${[...seasons].map(s => SEASON_EMOJI[s]).join('')}</b><span>stagioni coperte</span></div>
        ${far ? `<div><b>${far}</b><span>oltre i 40 min</span></div>` : ''}
      </div>
      ${!shared ? `<div class="fv-tools">
        <button class="fv-btn" data-act="share" type="button">🔗 Copia link della lista</button>
        <button class="fv-btn danger" data-act="clear" type="button">Svuota</button>
      </div>` : ''}
    </div>

    ${missing ? `<p class="fv-note">${missing} voce${missing > 1 ? ' non più presenti' : ' non più presente'}
      nella guida ${missing > 1 ? 'sono state ignorate' : 'è stata ignorata'}.</p>` : ''}

    ${!shared ? '<p class="fv-hint">Trascina per riordinare. Da tastiera: seleziona la maniglia e usa ↑ ↓.</p>' : ''}`;
}

function list(items, reorderable) {
  return `<ol class="fv-list${reorderable ? ' reorderable' : ''}" id="favList">
    ${items.map((a, i) => row(a, i, reorderable)).join('')}
  </ol>`;
}

function row(a, i, reorderable) {
  const kind = meta.kinds[a.kind];
  return `
  <li class="fv-item" data-id="${esc(a.id)}" data-index="${i}">
    ${reorderable ? `<button class="fv-handle" type="button" tabindex="0"
        aria-label="Sposta ${esc(a.title)}: usa le frecce su e giù">⠿</button>` : ''}
    <span class="fv-num">${i + 1}</span>
    <span class="fv-emoji" aria-hidden="true">${a.emoji}</span>
    <div class="fv-main">
      <h3>${esc(a.title)}</h3>
      <div class="fv-meta">
        <span class="pill pill-drive${a.drive.min > DRIVE_FAR ? ' far' : ''}">🚗 ${a.drive.min} min</span>
        <span class="pill pill-${a.difficulty}">${a.difficulty}</span>
        <span class="pill pill-kind">${kind.emoji} ${esc(kind.label)}</span>
        ${a.stroller ? '<span class="pill pill-stroller">🍼 passeggino</span>' : ''}
      </div>
    </div>
    <div class="fv-act">
      <button class="fv-icon" data-act="open" type="button" aria-label="Apri ${esc(a.title)}">›</button>
      ${reorderable ? `<button class="fv-icon danger" data-act="remove" type="button"
          aria-label="Togli ${esc(a.title)} dai preferiti">✕</button>` : ''}
    </div>
  </li>`;
}

function foot(shared) {
  if (shared) return '';
  return `<p class="fv-foot">L'ordine è il tuo piano: mettici in cima quello che
    vuoi fare prima. Resta salvato su questo dispositivo.</p>`;
}

function empty(shared) {
  if (shared) {
    return `<p class="empty">La lista condivisa non contiene attività riconoscibili.
      <button class="fv-btn" data-act="dismiss" type="button">Torna ai miei preferiti</button></p>`;
  }
  return `<div class="fv-empty">
    <p class="fv-empty-ico">☆</p>
    <h2>Nessun preferito, per ora</h2>
    <p>Tocca la stella in alto a destra di una scheda per salvarla qui.
       Poi puoi trascinare le voci per costruire il piano della settimana
       e mandarlo a qualcuno con un link.</p>
    <button class="fv-btn primary" data-act="browse" type="button">Vai alle attività</button>
  </div>`;
}

function fmtMinutes(total) {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

/* ── Azioni ───────────────────────────────────────────────────── */

function onClick(e) {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = btn.closest('.fv-item')?.dataset.id;

  switch (btn.dataset.act) {
    case 'open': onOpen(id); break;
    case 'remove': favs.remove(id); emit(); break;
    case 'clear': confirmClear(); break;
    case 'share': share(btn); break;
    case 'import':
      favs.addAll(state.sharedList);
      state.sharedList = null;
      emit();
      break;
    case 'dismiss': state.sharedList = null; emit(); break;
    case 'browse': state.view = 'cards'; emit(); break;
  }
}

function confirmClear() {
  if (!confirm(`Tolgo tutte e ${favs.size} le attività dai preferiti?`)) return;
  favs.clear();
  emit();
}

async function share(btn) {
  const url = `${location.origin}${location.pathname}?lista=${favs.list().join(',')}`;
  const done = msg => {
    const old = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => { btn.textContent = old; }, 2200);
  };
  try {
    await navigator.clipboard.writeText(url);
    done('✓ Link copiato');
  } catch {
    // clipboard negata (succede senza https o senza permesso): si mostra il link
    prompt('Copia questo link:', url);
  }
}

/* ── Riordino da tastiera ─────────────────────────────────────── */

function onKeydown(e) {
  if (!e.target.classList.contains('fv-handle')) return;
  const dir = { ArrowUp: -1, ArrowDown: 1 }[e.key];
  if (!dir) return;

  e.preventDefault();
  const item = e.target.closest('.fv-item');
  const from = +item.dataset.index;
  const to = from + dir;
  if (to < 0 || to >= favs.size) return;

  favs.move(from, to);
  emit();

  // il render ha ricostruito la lista: rimette il fuoco sulla stessa voce
  requestAnimationFrame(() => {
    $(`#favList .fv-item[data-id="${CSS.escape(item.dataset.id)}"] .fv-handle`)?.focus();
  });
}

/* ── Riordino trascinando ─────────────────────────────────────────
   Pointer Events: stessa strada per mouse, dito e penna. Durante il
   trascinamento si riordina il DOM al volo, e solo al rilascio si salva.

   Gli ascoltatori stanno su window e non sulla maniglia: spostare la voce
   nel DOM rilascia la cattura del puntatore, e il pointerup finale non
   arriverebbe mai all'elemento di partenza. */

let drag = null;

function onPointerDown(e) {
  const handle = e.target.closest('.fv-handle');
  if (!handle || e.button > 0) return;

  const item = handle.closest('.fv-item');
  const listEl = item.parentElement;
  e.preventDefault();

  drag = { item, listEl, handle, startY: e.clientY, pointerId: e.pointerId };
  item.classList.add('dragging');
  listEl.classList.add('is-dragging');

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}

function onPointerMove(e) {
  if (!drag || e.pointerId !== drag.pointerId) return;

  drag.item.style.transform = `translateY(${e.clientY - drag.startY}px)`;

  // La voce va inserita prima della prima altra voce il cui centro sta sotto
  // il puntatore; se non ce n'è nessuna, va in fondo. Ragionare sui centri
  // invece che su "dentro quale riga sono" evita il caso in cui il puntatore
  // salta di netto da una riga all'altra senza passare per quelle in mezzo.
  const others = [...drag.listEl.children].filter(el => el !== drag.item);
  const next = others.find(el => {
    const box = el.getBoundingClientRect();
    return e.clientY < box.top + box.height / 2;
  }) || null;

  if (next !== drag.item.nextElementSibling) {
    drag.listEl.insertBefore(drag.item, next);
    // la voce è saltata di posto: l'origine dello spostamento va rifatta,
    // altrimenti al frame dopo rimbalza avanti e indietro.
    drag.startY = e.clientY;
    drag.item.style.transform = '';
  }
}

function onPointerUp(e) {
  if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);

  drag.item.style.transform = '';
  drag.item.classList.remove('dragging');
  drag.listEl.classList.remove('is-dragging');

  const order = [...drag.listEl.children].map(el => el.dataset.id);
  drag = null;

  favs.setOrder(order);
  emit();
}
