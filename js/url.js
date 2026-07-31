/* Stato dei filtri nell'URL: un link condiviso riapre la stessa selezione.
   Il dettaglio usa il fragment (#a/<id>), i filtri la query string.

   `lista=` è a parte: contiene una selezione di preferiti mandata da qualcun
   altro. Non tocca i preferiti di chi apre il link finché non lo chiede. */

import { SORTS, DRIVE_DEFAULT, DRIVE_MAX } from './config.js';
import { state } from './store.js';

const SETS = [
  ['eta', 'ages'],
  ['tipo', 'kinds'],
  ['diff', 'diffs'],
  ['stag', 'seasons'],
];

const VIEWS = { map: 'map', preferiti: 'favs' };
const VIEW_PARAM = { map: 'map', favs: 'preferiti' };

/** Scrive lo stato corrente nella query string. */
export function writeUrl() {
  if (location.hash.startsWith('#a/')) return;   // il dettaglio ha la precedenza
  if (state.sharedList) return;                  // non riscrivere il link condiviso

  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  for (const [key, field] of SETS) {
    if (state[field].size) p.set(key, [...state[field]].join(','));
  }
  if (state.maxDrive !== DRIVE_DEFAULT) p.set('auto', state.maxDrive);
  if (state.sort !== 'drive') p.set('ord', state.sort);
  if (VIEW_PARAM[state.view]) p.set('vista', VIEW_PARAM[state.view]);

  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

/** Applica allo stato quello che c'è nell'URL. */
export function readUrl() {
  const p = new URLSearchParams(location.search);

  state.q = p.get('q') || '';
  for (const [key, field] of SETS) {
    state[field].clear();
    (p.get(key) || '').split(',').filter(Boolean).forEach(v => state[field].add(v));
  }

  const drive = Number(p.get('auto'));
  if (Number.isFinite(drive) && drive > 0) state.maxDrive = Math.min(drive, DRIVE_MAX);
  if (SORTS[p.get('ord')]) state.sort = p.get('ord');
  if (VIEWS[p.get('vista')]) state.view = VIEWS[p.get('vista')];

  // una lista condivisa apre direttamente la vista preferiti
  const shared = (p.get('lista') || '').split(',').map(s => s.trim()).filter(Boolean);
  if (shared.length) {
    state.sharedList = shared;
    state.view = 'favs';
  }
}

/** id dell'attività nel fragment, se presente. */
export function hashId() {
  const m = location.hash.match(/^#a\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}
