/* Guida di Simöu — punto di ingresso.
   Mette insieme i moduli e tiene il ciclo di render. */

import { DRIVE_MAX } from './config.js';
import { loadData } from './data.js';
import { state, subscribe, emit } from './store.js';
import { apply, secondaryCount } from './filters.js';
import { writeUrl, readUrl, hashId } from './url.js';
import { $ } from './ui/dom.js';
import { initTheme } from './ui/theme.js';
import { buildControls, syncControls } from './ui/controls.js';
import { initCards, renderCards, setRerender } from './ui/cards.js';
import { initDetail, openDetail } from './ui/detail.js';
import { initMap, renderMap } from './ui/map.js';

let data = null;

async function start() {
  initTheme();

  try {
    data = await loadData();
  } catch (err) {
    console.error(err);
    $('#results').innerHTML = '<p class="empty">Non riesco a caricare i dati delle attività. ' +
      'Riprova quando hai rete: dopo la prima visita la guida resta disponibile offline.</p>';
    return;
  }

  buildControls(data);
  initCards(data.meta, openDetail);
  initDetail(data);
  initMap(data.meta);
  setRerender(render);

  subscribe(render);
  addEventListener('hashchange', openFromHash);

  readUrl();
  syncControls();
  render();
  openFromHash();

  registerServiceWorker();
}

function render() {
  const list = apply(data.activities);

  $('#activeCount').textContent = secondaryCount() || '';
  $('#count').innerHTML = `<strong>${list.length}</strong> attività` +
    (state.maxDrive < DRIVE_MAX ? ` entro ${state.maxDrive} min di auto` : '');
  $('#empty').hidden = list.length > 0;

  const showMap = state.view === 'map';
  $('#results').hidden = showMap;
  $('#map').hidden = !showMap;

  if (showMap) renderMap(list, openDetail);
  else renderCards(list);

  writeUrl();
}

function openFromHash() {
  const id = hashId();
  if (id) openDetail(id);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline è un extra */ });
}

start();

// riesposto per i test manuali da console
window.__guida = { get data() { return data; }, state, emit };
