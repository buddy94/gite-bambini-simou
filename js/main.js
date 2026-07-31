/* Guida di Simöu — punto di ingresso.
   Mette insieme i moduli e tiene il ciclo di render. */

import { DRIVE_MAX } from './config.js';
import { loadData } from './data.js';
import { state, subscribe, emit } from './store.js';
import { apply, secondaryCount } from './filters.js';
import { writeUrl, readUrl, hashId } from './url.js';
import { $ } from './ui/dom.js';
import { initTheme } from './ui/theme.js';
import { buildControls, syncControls, paintFavCount, paintView } from './ui/controls.js';
import { initCards, renderCards, setFavChangeHandler } from './ui/cards.js';
import { initDetail, openDetail } from './ui/detail.js';
import { initMap, renderMap } from './ui/map.js';
import { initFavorites, renderFavorites } from './ui/favorites.js';

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
  initFavorites(data, openDetail);
  setFavChangeHandler(paintFavCount);

  subscribe(render);
  addEventListener('hashchange', openFromHash);

  readUrl();
  syncControls();
  render();
  openFromHash();

  registerServiceWorker();
}

function render() {
  const showing = state.view;

  $('#results').hidden = showing !== 'cards';
  $('#map').hidden = showing !== 'map';
  $('#favs').hidden = showing !== 'favs';
  paintView();
  paintFavCount();

  // Nella vista preferiti i filtri non servono, ma la barra resta: contiene
  // il selettore di vista, ed è l'unico modo per tornare indietro.
  $('.filters').classList.toggle('compact', showing === 'favs');

  if (showing === 'favs') {
    $('#empty').hidden = true;
    renderFavorites();
    writeUrl();
    return;
  }

  const list = apply(data.activities);

  $('#activeCount').textContent = secondaryCount() || '';
  $('#count').innerHTML = `<strong>${list.length}</strong> attività` +
    (state.maxDrive < DRIVE_MAX ? ` entro ${state.maxDrive} min di auto` : '');
  $('#empty').hidden = list.length > 0;

  if (showing === 'map') renderMap(list, openDetail);
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
