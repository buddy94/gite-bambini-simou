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
  view: 'cards',        // cards | map | favs
  sharedList: null,     // lista arrivata da un link condiviso, non ancora importata
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
  // la vista non si azzera: è una preferenza di lettura, non un filtro,
  // e resettarla mentre si guardano i preferiti sarebbe irritante.
}

/* ── Preferiti ────────────────────────────────────────────────────
   Array e non Set: l'ordine è deciso dall'utente trascinando le voci,
   ed è la cosa che rende la lista un piano invece di un elenco. */

let items = read();

export const favs = {
  /** Gli id nell'ordine scelto dall'utente. */
  list: () => [...items],

  has: id => items.includes(id),

  get size() { return items.length; },

  /** Aggiunge in fondo o rimuove. Ritorna true se ora è tra i preferiti. */
  toggle(id) {
    const i = items.indexOf(id);
    if (i >= 0) items.splice(i, 1);
    else items.push(id);
    write();
    return i < 0;
  },

  remove(id) {
    const i = items.indexOf(id);
    if (i >= 0) { items.splice(i, 1); write(); }
  },

  /** Sposta l'elemento dalla posizione `from` alla posizione `to`. */
  move(from, to) {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    write();
  },

  /** Sostituisce l'intero ordine (usato dal riordino con il mouse). */
  setOrder(ids) {
    items = ids.filter(id => items.includes(id));
    write();
  },

  /** Aggiunge in blocco quelli che mancano, mantenendo l'ordine dato. */
  addAll(ids) {
    for (const id of ids) if (!items.includes(id)) items.push(id);
    write();
  },

  clear() { items = []; write(); },
};

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE.favs) || '[]');
    // tollera il formato vecchio (stesso array, nessuna migrazione necessaria)
    return Array.isArray(raw) ? raw.filter(x => typeof x === 'string') : [];
  } catch {
    return [];   // localStorage pieno o disabilitato: si continua senza preferiti
  }
}

function write() {
  try {
    localStorage.setItem(STORAGE.favs, JSON.stringify(items));
  } catch { /* ignorato di proposito: i preferiti sono un extra */ }
}
