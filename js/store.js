/* Stato dell'applicazione e preferiti.

   Unico punto in cui lo stato viene modificato. Chi cambia qualcosa chiama un
   setter; i moduli di interfaccia si iscrivono con subscribe() e ridisegnano. */

import { DRIVE_DEFAULT, STORAGE } from './config.js';

const listeners = new Set();

export const state = {
  q: '',
  ages: new Set(),
  kinds: new Set(),
  diffs: new Set(),
  seasons: new Set(),
  maxDrive: DRIVE_DEFAULT,
  sort: 'drive',
  favOnly: false,
  view: 'cards',
};

/** Registra un callback chiamato a ogni cambio di stato. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Notifica gli iscritti. Da chiamare dopo aver modificato `state`. */
export function emit() {
  for (const fn of listeners) fn();
}

export function toggleIn(set, value) {
  set.has(value) ? set.delete(value) : set.add(value);
  return set.has(value);
}

export function resetState() {
  state.q = '';
  state.ages.clear();
  state.kinds.clear();
  state.diffs.clear();
  state.seasons.clear();
  state.maxDrive = DRIVE_DEFAULT;
  state.sort = 'drive';
  state.favOnly = false;
  // la vista (schede/mappa) non si azzera: è una preferenza di lettura,
  // non un filtro, e resettarla disorienta.
}

/* ── Preferiti ────────────────────────────────────────────────── */

export const favs = {
  _set: new Set(read()),
  has(id) { return this._set.has(id); },
  toggle(id) {
    const now = toggleIn(this._set, id);
    write([...this._set]);
    return now;
  },
  get size() { return this._set.size; },
};

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.favs) || '[]');
  } catch {
    return [];   // localStorage pieno o disabilitato: si continua senza preferiti
  }
}

function write(list) {
  try {
    localStorage.setItem(STORAGE.favs, JSON.stringify(list));
  } catch { /* ignorato di proposito */ }
}
