/* Finestra di dettaglio di una singola attività, con deep link #a/<id>. */

import { SEASON_EMOJI, DRIVE_FAR } from '../config.js';
import { $, esc, fmtKm } from './dom.js';

let meta = null;
let activities = [];

export function initDetail(data) {
  meta = data.meta;
  activities = data.activities;

  $('#detailClose').addEventListener('click', close);
  $('#detail').addEventListener('click', e => {
    if (e.target === $('#detail')) close();      // click sullo sfondo
  });
  $('#detail').addEventListener('close', clearHash);
}

export function openDetail(id) {
  const a = activities.find(x => x.id === id);
  if (!a) return;

  $('#detailBody').innerHTML = body(a);
  history.replaceState(null, '', `#a/${encodeURIComponent(a.id)}`);

  const dlg = $('#detail');
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}

const close = () => $('#detail').close();

function clearHash() {
  if (location.hash.startsWith('#a/')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function body(a) {
  const kind = meta.kinds[a.kind];
  const s = a.stats || {};
  const o = meta.origin;

  const facts = [
    ['In auto', `${a.drive.min} min · ${String(a.drive.km).replace('.', ',')} km`],
    ['Verso', a.drive.to],
    s.km && ['Lunghezza', fmtKm(s.km)],
    s.up && ['Dislivello', `${Math.abs(s.up)} m${s.up < 0 ? ' ↓' : ''}`],
    s.time && ['Durata', s.time],
    s.alt && ['Quota', s.alt],
    s.type && ['Percorso', s.type],
    ['Difficoltà', a.difficulty],
  ].filter(Boolean);

  const gmaps = 'https://www.google.com/maps/dir/?api=1' +
    `&origin=${o.lat},${o.lon}&destination=${a.lat},${a.lon}&travelmode=driving`;

  return `
    ${a.images && a.images[0]
      ? `<div class="d-hero"><img src="${esc(a.images[0])}" alt=""
           onerror="this.parentElement.remove()"></div>` : ''}
    <div class="d-body">
      <h2 id="detailTitle">${a.emoji} ${esc(a.title)}</h2>

      <div class="d-meta">
        <span class="pill pill-drive${a.drive.min > DRIVE_FAR ? ' far' : ''}">🚗 ${a.drive.min} min</span>
        <span class="pill pill-${a.difficulty}">${a.difficulty}</span>
        <span class="pill pill-kind">${kind.emoji} ${esc(kind.label)}</span>
        ${a.rating ? `<span class="pill pill-rating">★ ${a.rating.toFixed(1)}</span>` : ''}
        ${a.ages.map(x => `<span class="pill pill-age">${meta.ages[x].emoji} ${esc(meta.ages[x].label)}</span>`).join('')}
      </div>

      <p class="d-why">${esc(a.why)}</p>
      <p class="desc">${esc(a.desc)}</p>

      ${a.toddler ? `<div class="d-toddler">
        <h3>🍼 Con un bimbo piccolo</h3>
        <p>${esc(a.toddler)}${a.stroller ? ' <strong>Il passeggino ci passa.</strong>' : ''}</p>
      </div>` : ''}

      <dl class="d-grid">
        ${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}
      </dl>

      ${a.warn ? `<p class="d-warn">⚠️ ${esc(a.warn)}</p>` : ''}

      <p class="d-season">Stagione: ${a.season.map(x => `${SEASON_EMOJI[x]} ${x}`).join(' · ')}</p>

      ${a.tags && a.tags.length
        ? `<div class="d-tags">${a.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}

      <div class="d-links">
        <a class="primary" href="${gmaps}" target="_blank" rel="noopener">🗺️ Indicazioni da Simöu</a>
        ${(a.links || []).map(l =>
          `<a href="${esc(l.url)}" target="_blank" rel="noopener">${icon(l.kind)} ${esc(l.label)}</a>`
        ).join('')}
      </div>
    </div>`;
}

const icon = kind => ({ alltrails: '🥾', info: '📖', web: '🌐' }[kind] || '🔗');
