/* Filtro e ordinamento: funzioni pure sullo stato corrente. */

import { DIFFS, DRIVE_MAX } from './config.js';
import { state } from './store.js';

/** Applica tutti i filtri attivi e ordina secondo `state.sort`. */
export function apply(activities) {
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);

  return activities
    .filter(a => matches(a, words))
    .sort(COMPARATORS[state.sort] || COMPARATORS.drive);
}

function matches(a, words) {
  if (state.maxDrive < DRIVE_MAX && a.drive.min > state.maxDrive) return false;
  if (state.ages.size && !a.ages.some(x => state.ages.has(x))) return false;
  if (state.kinds.size && !state.kinds.has(a.kind)) return false;
  if (state.diffs.size && !state.diffs.has(a.difficulty)) return false;
  if (state.seasons.size && !a.season.some(s => state.seasons.has(s))) return false;
  if (words.length && !words.every(w => haystack(a).includes(w))) return false;
  return true;
}

/* La stringa di ricerca viene costruita una volta sola per attività e
   memorizzata sull'oggetto: cercare mentre si digita chiama matches()
   su ogni attività a ogni tasto premuto. */
function haystack(a) {
  if (!a._search) {
    a._search = [a.title, a.why, a.desc, a.toddler, a.drive.to, ...(a.tags || [])]
      .filter(Boolean).join(' ').toLowerCase();
  }
  return a._search;
}

const COMPARATORS = {
  drive: (a, b) => a.drive.min - b.drive.min || rating(b) - rating(a),
  rating: (a, b) => rating(b) - rating(a) || a.drive.min - b.drive.min,
  difficulty: (a, b) =>
    DIFFS.indexOf(a.difficulty) - DIFFS.indexOf(b.difficulty) || a.drive.min - b.drive.min,
  name: (a, b) => a.title.localeCompare(b.title, 'it'),
};

const rating = a => a.rating || 0;

/** Quanti filtri "secondari" sono attivi (per il contatore sul pannello). */
export const secondaryCount = () =>
  state.kinds.size + state.diffs.size + state.seasons.size;
