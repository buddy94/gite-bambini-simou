/* Stato dei filtri nell'URL: un link condiviso riapre la stessa selezione.
   Il dettaglio usa il fragment (#a/<id>), i filtri la query string. */

import { SORTS, DRIVE_DEFAULT, DRIVE_MAX } from './config.js';
import { state } from './store.js';

const SETS = [
  ['eta', 'ages'],
  ['tipo', 'kinds'],
  ['diff', 'diffs'],
  ['stag', 'seasons'],
];

/** Scrive lo stato corrente nella query string. */
export function writeUrl() {
  if (location.hash.startsWith('#a/')) return;   // il dettaglio ha la precedenza

  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  for (const [key, field] of SETS) {
    if (state[field].size) p.set(key, [...state[field]].join(','));
  }
  if (state.maxDrive !== DRIVE_DEFAULT) p.set('auto', state.maxDrive);
  if (state.sort !== 'drive') p.set('ord', state.sort);
  if (state.favOnly) p.set('fav', '1');
  if (state.view !== 'cards') p.set('vista', state.view);

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
  state.favOnly = p.get('fav') === '1';
  if (p.get('vista') === 'map') state.view = 'map';
}

/** id dell'attività nel fragment, se presente. */
export function hashId() {
  const m = location.hash.match(/^#a\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}
