/* Tema chiaro/scuro: preferenza di sistema al primo avvio, poi scelta salvata. */

import { STORAGE } from '../config.js';
import { $ } from './dom.js';

export function initTheme() {
  const saved = localStorage.getItem(STORAGE.theme);
  apply(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);

  $('#themeBtn').addEventListener('click', () =>
    apply(document.documentElement.dataset.theme !== 'dark'));
}

function apply(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  try { localStorage.setItem(STORAGE.theme, dark ? 'dark' : 'light'); } catch { /* ok */ }
  $('#themeBtn').textContent = dark ? '☀️' : '🌙';
  $('#themeBtn').setAttribute('aria-label', dark ? 'Passa al tema chiaro' : 'Passa al tema scuro');
  $('meta[name="theme-color"]').content = dark ? '#15171a' : '#1a3c2a';
}
