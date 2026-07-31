/* Utilità DOM e formattazione, condivise dai moduli di interfaccia. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape per interpolare testo dentro i template HTML. */
export function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 0,165 → "165 m"; 4.2 → "4,2 km" (virgola decimale, come si scrive in italiano). */
export function fmtKm(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${String(km).replace('.', ',')} km`;
}

export const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

/** Bottone-chip con stato aria-pressed. */
export function chip(value, label, pressed = false) {
  return `<button class="chip" type="button" data-val="${esc(value)}" ` +
    `aria-pressed="${pressed}">${label}</button>`;
}
