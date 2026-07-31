/* Griglia delle schede, con raggruppamento per fascia di tempo in auto
   quando l'ordinamento è per vicinanza. */

import { DRIVE_BANDS, DRIVE_FAR } from '../config.js';
import { state, favs, emit } from '../store.js';
import { $, esc, fmtKm } from './dom.js';

let meta = null;
let onOpen = () => {};

export function initCards(dataMeta, openDetail) {
  meta = dataMeta;
  onOpen = openDetail;

  const box = $('#results');
  box.addEventListener('click', e => {
    const fav = e.target.closest('.fav');
    if (fav) {
      e.stopPropagation();
      const now = favs.toggle(fav.dataset.id);
      fav.textContent = now ? '★' : '☆';
      fav.setAttribute('aria-pressed', now);
      onFavChange();
      return;
    }
    const card = e.target.closest('.card');
    if (card) onOpen(card.dataset.id);
  });

  box.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.card');
    if (!card || e.target.closest('.fav')) return;
    e.preventDefault();
    onOpen(card.dataset.id);
  });
}

/* Cosa fare dopo un toggle della stella (aggiornare il contatore sul pulsante
   Preferiti): iniettato da main.js, cards.js non conosce il resto dell'app. */
let onFavChange = () => {};
export const setFavChangeHandler = fn => { onFavChange = fn; };

export function renderCards(list) {
  const box = $('#results');
  if (!list.length) { box.innerHTML = ''; return; }

  box.innerHTML = state.sort === 'drive' ? grouped(list) : list.map(card).join('');
}

function grouped(list) {
  let html = '';
  let floor = -1;
  for (const band of DRIVE_BANDS) {
    const chunk = list.filter(a => a.drive.min > floor && a.drive.min <= band.max);
    floor = band.max;
    if (!chunk.length) continue;
    html += `<div class="group-head"><h2>${band.label}</h2>` +
      `<span>${band.hint} · ${chunk.length}</span></div>` +
      chunk.map(card).join('');
  }
  return html;
}

function card(a) {
  const kind = meta.kinds[a.kind];
  const img = a.images && a.images[0];
  const fav = favs.has(a.id);

  return `
  <article class="card${a.featured ? ' featured' : ''}" data-id="${esc(a.id)}" tabindex="0">
    <button class="fav" type="button" data-id="${esc(a.id)}"
            aria-pressed="${fav}" aria-label="Aggiungi ai preferiti">${fav ? '★' : '☆'}</button>
    ${img
      ? `<div class="card-thumb"><img src="${esc(img)}" alt="" loading="lazy" decoding="async"
           onerror="this.parentElement.classList.add('no-img');this.remove()"></div>`
      : `<div class="card-thumb no-img">${a.emoji}</div>`}
    <div class="card-body">
      <h3>${esc(a.title)}</h3>
      <div class="card-meta">
        <span class="pill pill-drive${a.drive.min > DRIVE_FAR ? ' far' : ''}">🚗 ${a.drive.min} min</span>
        <span class="pill pill-${a.difficulty}">${a.difficulty}</span>
        <span class="pill pill-kind">${kind.emoji} ${esc(kind.label)}</span>
        ${a.rating ? `<span class="pill pill-rating">★ ${a.rating.toFixed(1)}</span>` : ''}
        ${a.stroller ? '<span class="pill pill-stroller">🍼 passeggino</span>' : ''}
      </div>
      <p class="why">${esc(a.why)}</p>
      ${statsRow(a.stats)}
    </div>
  </article>`;
}

function statsRow(s = {}) {
  const bits = [];
  if (s.km) bits.push(`<span><b>${fmtKm(s.km)}</b></span>`);
  if (s.up) bits.push(`<span>⛰️ <b>${Math.abs(s.up)} m</b></span>`);
  if (s.time) bits.push(`<span>⏱️ <b>${esc(s.time)}</b></span>`);
  if (s.alt) bits.push(`<span>📍 ${esc(s.alt)}</span>`);
  return bits.length ? `<div class="card-stats">${bits.join('')}</div>` : '';
}
