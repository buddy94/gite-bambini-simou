# 🏔️ Guida di Simöu

Cosa fare quando si è in vacanza a **Simöu** (Olivone, Valle di Blenio, Ticino).
Gite, sentieri, acqua, animali, arrampicata, alpinismo, bici e attività al coperto —
per **piccolissimi 0-4**, **bambini 4-9**, **ragazzi 10-16** e **adulti**, con i
**tempi reali in auto** calcolati porta a porta da casa.

👉 **[Vedi il sito](https://buddy94.github.io/gite-bambini-simou/)**

---

## Com'è fatto

Sito statico puro: HTML, CSS e moduli ES nativi. Nessun framework, nessuna build,
nessuna dipendenza da installare. Si apre `index.html` da un server statico e funziona.

```
.
├── index.html                  # sola impalcatura: i contenuti arrivano dai dati
│
├── css/
│   ├── base.css                # reset, variabili di tema, chiaro/scuro
│   ├── layout.css              # intestazione, fasce d'età, filtri, footer
│   ├── cards.css               # griglia schede + etichette (pill)
│   ├── detail.css              # finestra di dettaglio
│   └── map.css                 # contenitore mappa, pin, fumetti
│
├── js/
│   ├── main.js                 # punto di ingresso e ciclo di render
│   ├── config.js               # elenchi di valori ammessi e soglie
│   ├── data.js                 # caricamento, unione e validazione dei dati
│   ├── store.js                # stato + preferiti (unico punto di mutazione)
│   ├── filters.js              # filtro e ordinamento (funzioni pure)
│   ├── url.js                  # stato dei filtri nell'URL, deep link
│   └── ui/
│       ├── dom.js              # helper DOM e formattazione
│       ├── theme.js            # tema chiaro/scuro
│       ├── controls.js         # costruzione e binding dei controlli
│       ├── cards.js            # render della griglia
│       ├── detail.js           # finestra di dettaglio
│       └── map.js              # Leaflet, caricato solo quando serve
│
├── data/
│   ├── index.json              # manifest: quali file caricare
│   ├── meta.json               # origine, fasce d'età, tipi di attività
│   └── activities/
│       ├── sentieri.json
│       ├── verticale.json      # arrampicata, alpinismo, capanne
│       ├── famiglia.json       # acqua, animali, avventura
│       └── cultura.json        # cultura, gusto, bici, pioggia, inverno
│
├── sw.js                       # service worker: la guida funziona offline
├── manifest.webmanifest        # installabile come app sul telefono
└── tools/                      # script di manutenzione (Python, non servono al sito)
    ├── geocode.py              # coordinate dei luoghi via Nominatim/OSM
    ├── geocode2.py             # punti di accesso in auto (parcheggi, stazioni a valle)
    └── route.py                # tempi e distanze in auto da Simöu via OSRM
```

### Funzioni

- Quattro **fasce d'età** selezionabili, generate dai dati
- Note **specifiche per i piccolissimi**: passeggino sì/no, dove accorciare, cosa guardare
- **Ricerca** libera su titolo, descrizione, note e tag
- **Filtri** per tipo, difficoltà, stagione e tempo massimo in auto
- **Mappa interattiva** (Leaflet + OpenStreetMap) con pin colorati per tipo
- **Preferiti** salvati sul dispositivo
- **Link condivisibili**: i filtri finiscono nell'URL, le schede hanno un `#a/<id>`
- **Tema chiaro/scuro**, mobile-first
- **Offline**: dopo la prima visita la guida resta leggibile senza rete (mappa esclusa)

---

## Aggiungere contenuti

### Una nuova attività

Si tocca **solo** il file tematico giusto in `data/activities/`. Schede, filtri,
mappa e conteggi si aggiornano da soli.

```jsonc
{
  "id": "identificatore-univoco",         // usato anche nei link #a/<id>
  "title": "Nome dell'attività",
  "emoji": "🥾",
  "kind": "sentiero",                     // deve esistere in meta.json → kinds
  "ages": ["0-4", "4-9"],                 // devono esistere in meta.json → ages
  "difficulty": "facile",                 // facile | moderato | impegnativo | alpinistico
  "drive": { "min": 19, "km": 13.4, "to": "Campo Blenio" },
  "lat": 46.55706, "lon": 8.93538,
  "stats": { "km": 2, "up": 40, "time": "40 min", "alt": "1217 m", "type": "anello" },
  "rating": 4.8,
  "featured": true,                       // opzionale: badge ★ Top
  "why": "Una riga sul perché vale la pena.",
  "desc": "Descrizione estesa.",
  "toddler": "Nota per chi ha un bimbo piccolo.",   // opzionale
  "stroller": true,                       // opzionale: il passeggino ci passa
  "tags": ["pineta", "parco giochi"],
  "season": ["estate", "autunno"],
  "warn": "Avvertenza, se serve.",        // opzionale
  "images": ["https://…"],                // opzionale
  "links": [{ "label": "AllTrails", "kind": "alltrails", "url": "https://…" }]
}
```

`data.js` valida al caricamento (id duplicati, tipi e fasce inesistenti, campi
mancanti) e segnala in console senza rompere la pagina: una voce sbagliata non
deve far sparire tutta la guida.

### Un nuovo tema

Crea `data/activities/<nome>.json` con `{ "title": "...", "activities": [...] }`
e aggiungi `"activities/<nome>.json"` a `sources` in `data/index.json`. Fine.

### Una nuova fascia d'età o un nuovo tipo

Aggiungi la voce in `data/meta.json` (`ages` o `kinds`). Le schede delle fasce e
i chip dei filtri sono generati da lì.

---

## Ricalcolare i tempi in auto

I tempi in `drive` sono calcolati con [OSRM](https://project-osrm.org/) su dati
OpenStreetMap, partendo da Simöu (`46.53803, 8.90831`).

```bash
python tools/geocode.py > tools/_places.json
python tools/route.py tools/_places.json > tools/_drive.json
```

Due avvertenze imparate sul campo:

1. **Il punto dell'attività non è sempre il punto di accesso.** Capanne, cime e
   impianti a fune non si raggiungono in auto: in `drive` va il parcheggio o la
   stazione a valle, non la vetta. Altrimenti OSRM instrada su mulattiere e
   restituisce tempi senza senso.
2. **OSRM ignora le chiusure stagionali.** Il Passo del Lucomagno è chiuso
   d'inverno: la stagionalità va marcata a mano nel campo `season` e in `warn`.

---

## Il numero che conta

Da Simöu servono **~15 minuti solo per scendere a Olivone**. È il pedaggio fisso
di ogni gita, e sposta molto: entro 40 minuti ci sta quasi tutta la valle fino a
Biasca, ma **non** Bellinzona (58 min), il Ritom (63 min), Faido (63 min), il Nara
(45 min) o la diga del Luzzone (47 min). Il sito lo dice apertamente invece di
arrotondare per difetto — il filtro parte da 45 minuti e si può alzare.

---

## Fonti

AllTrails · Svizzera Turismo · Bellinzonese e Valli · Pro Natura Lucomagno ·
ticino.ch · theCrag · Falesia.it · CAS/SAC · nara.ch · Blenio Bike ·
La Fabbrica del Cioccolato · Ticino per bambini
