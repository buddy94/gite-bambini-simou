/* Caricamento dei dati.

   I contenuti sono spezzati in più file tematici, elencati in data/index.json.
   Aggiungere un tema significa creare un file e aggiungerlo al manifest: nessuna
   modifica al codice. Qui vengono uniti in un'unica lista e validati. */

const BASE = 'data/';

/** Carica manifest, meta e tutti i file di attività. Ritorna { meta, activities }. */
export async function loadData() {
  const manifest = await getJson(`${BASE}index.json`);
  const [meta, ...chunks] = await Promise.all([
    getJson(BASE + manifest.meta),
    ...manifest.sources.map(src => getJson(BASE + src)),
  ]);

  const activities = chunks.flatMap((chunk, i) =>
    (chunk.activities || []).map(a => ({ ...a, _source: manifest.sources[i] })));

  validate(activities, meta);
  return { meta, activities };
}

async function getJson(url) {
  // 'no-cache' non vuol dire "non mettere in cache": vuol dire "chiedi sempre
  // al server se è cambiato". La risposta è di solito un 304 vuoto, quindi
  // costa nulla, ma evita che chi ha già aperto la guida resti con le
  // attività di ieri finché non scade la cache del browser.
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

/* Non blocca il caricamento: segnala in console e lascia vedere il resto.
   Una voce sbagliata non deve far sparire tutta la guida. */
function validate(activities, meta) {
  const seen = new Set();
  const problems = [];

  for (const a of activities) {
    if (seen.has(a.id)) problems.push(`id duplicato: ${a.id} (${a._source})`);
    seen.add(a.id);

    if (!meta.kinds[a.kind]) problems.push(`${a.id}: tipo sconosciuto "${a.kind}"`);
    for (const age of a.ages || []) {
      if (!meta.ages[age]) problems.push(`${a.id}: fascia sconosciuta "${age}"`);
    }
    for (const key of ['title', 'emoji', 'why', 'desc', 'lat', 'lon', 'drive']) {
      if (a[key] === undefined) problems.push(`${a.id}: manca "${key}"`);
    }
  }

  if (problems.length) {
    console.warn(`[guida-simou] ${problems.length} problemi nei dati:\n` + problems.join('\n'));
  }
}
