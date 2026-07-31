# 🏔️ Guida di Simöu

Cosa fare quando si è in vacanza a **Simöu** (Olivone, Valle di Blenio, Ticino).
Gite, sentieri, acqua, animali, arrampicata, alpinismo, bici e attività al coperto —
per **bambini 4-9**, **ragazzi 10-16** e **adulti**, con i **tempi reali in auto**
calcolati porta a porta da casa.

👉 **[Vedi il sito](https://buddy94.github.io/gite-bambini-simou/)**

---

## Com'è fatto

Sito statico puro: HTML + CSS + JS, nessun framework e nessuna build.
Tutti i contenuti stanno in un unico file di dati.

```
.
├── index.html                # struttura della pagina
├── css/main.css              # tema chiaro/scuro
├── js/main.js                # filtri, ricerca, mappa, dettaglio
├── data/activities.json      # ← tutti i contenuti stanno qui
├── sw.js                     # service worker: la guida funziona offline
├── manifest.webmanifest      # installabile come app sul telefono
└── tools/                    # script di manutenzione (Python, non servono al sito)
    ├── geocode.py            # coordinate dei luoghi via Nominatim/OSM
    ├── geocode2.py           # punti di accesso in auto (parcheggi, stazioni a valle)
    └── route.py              # tempi e distanze in auto da Simöu via OSRM
```

### Funzioni

- Tre **fasce d'età** selezionabili, con conteggio attività
- **Ricerca** libera su titolo, descrizione e tag
- **Filtri** per tipo, difficoltà, stagione e tempo massimo in auto
- **Mappa interattiva** (Leaflet + OpenStreetMap) con pin colorati per tipo
- **Preferiti** salvati sul dispositivo
- **Link condivisibili**: i filtri finiscono nell'URL, le schede hanno un `#a/<id>`
- **Tema chiaro/scuro**, mobile-first
- **Offline**: dopo la prima visita la guida resta leggibile senza rete (mappa esclusa)

---

## Aggiungere o modificare un'attività

Si tocca **solo** `data/activities.json`. Nessun'altra modifica è necessaria:
schede, filtri, mappa e conteggi si aggiornano da soli.

```jsonc
{
  "id": "identificatore-univoco",         // usato anche nei link #a/<id>
  "title": "Nome dell'attività",
  "emoji": "🥾",
  "kind": "sentiero",                     // vedi meta.kinds nel JSON
  "ages": ["4-9", "ragazzi", "adulti"],   // una o più fasce
  "difficulty": "facile",                 // facile | moderato | impegnativo | alpinistico
  "drive": { "min": 19, "km": 13.4, "to": "Campo Blenio" },
  "lat": 46.55706, "lon": 8.93538,
  "stats": { "km": 2, "up": 40, "time": "40 min", "alt": "1217 m", "type": "anello" },
  "rating": 4.8,
  "featured": true,                       // opzionale: badge ★ Top
  "why": "Una riga sul perché vale la pena.",
  "desc": "Descrizione estesa.",
  "tags": ["pineta", "parco giochi"],
  "season": ["estate", "autunno"],
  "warn": "Avvertenza, se serve.",        // opzionale
  "images": ["https://…"],                // opzionale
  "links": [{ "label": "AllTrails", "kind": "alltrails", "url": "https://…" }]
}
```

### Ricalcolare i tempi in auto

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
