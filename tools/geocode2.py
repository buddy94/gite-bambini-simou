#!/usr/bin/env python3
"""Secondo giro di geocodifica: punti mancanti e correzioni.

Il primo giro (geocode.py) geocodifica il *luogo* dell'attivita'. Per capanne,
cime e impianti a fune quel punto non e' raggiungibile in auto: qui si
geocodificano i punti di *accesso* (parcheggio, stazione a valle, paese).

Uso: python tools/geocode2.py   (scrive tools/_places2.json in utf-8)
"""
import json
import sys
import time
import urllib.parse
import urllib.request

UA = "GuidaSimou/1.0 (https://github.com/buddy94/gite-simou)"

PLACES = {
    # correzioni: Nominatim aveva preso la valle, non il paese
    "malvaglia-paese": "6713 Malvaglia, Ticino, Switzerland",
    # punti di accesso in auto
    "pian-geirett": "Pian Geirett, Ghirone, Switzerland",
    "carassino": "Val Carassino, Aquila, Switzerland",
    "marolta": "Marolta, Castro, Switzerland",
    "piotta-funicolare": "Funicolare Ritom, Piotta, Switzerland",
    # attivita' puntuali
    "pineta-saracin": "Pineta Saracin, Campo Blenio, Switzerland",
    "centro-poli": "Centro Polisportivo Olivone, Switzerland",
    "camping-olivone": "TCS Camping Acquarossa Olivone, Switzerland",
    "cima-norma": "Cima Norma, Dangio-Torre, Switzerland",
    "ponte-tibetano-riasc": "Ponte tibetano Riasc, Blenio, Switzerland",
    "prugiasco": "Prugiasco, Acquarossa, Switzerland",
    "castro": "Castro, Acquarossa, Switzerland",
    "largario": "Largario, Acquarossa, Switzerland",
    "motto-blenio": "Motto, Blenio, Switzerland",
    "olivone-posta": "Olivone Posta, Blenio, Switzerland",
    "serravalle": "Serravalle, Ticino, Switzerland",
    "giornico": "Giornico, Ticino, Switzerland",
    "personico": "Personico, Ticino, Switzerland",
    "lodrino": "Lodrino, Riviera, Switzerland",
    "iragna": "Iragna, Riviera, Switzerland",
    "loderio": "Loderio, Biasca, Switzerland",
    "grumo": "Grumo, Blenio, Switzerland",
}


def geocode(query):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": query, "format": "json", "limit": 1}
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.load(r)
    if not data:
        return None
    hit = data[0]
    return {"lat": float(hit["lat"]), "lon": float(hit["lon"]),
            "display_name": hit["display_name"]}


def main():
    out = {}
    for pid, query in PLACES.items():
        try:
            hit = geocode(query)
        except Exception as exc:  # noqa: BLE001 - script diagnostico
            print(f"ERR  {pid}: {exc}", file=sys.stderr)
            hit = None
        if hit is None:
            print(f"MISS {pid}: {query}", file=sys.stderr)
        else:
            print(f"OK   {pid}: {hit['lat']:.5f},{hit['lon']:.5f}  {hit['display_name'][:70]}",
                  file=sys.stderr)
            out[pid] = hit
        time.sleep(1.1)
    with open("tools/_places2.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
