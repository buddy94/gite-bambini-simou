#!/usr/bin/env python3
"""Geocodifica i luoghi della guida via Nominatim (OSM).

Uso: python tools/geocode.py > tools/_places.json

Rispetta il rate limit di Nominatim (1 req/s). I risultati vanno rivisti a mano:
alcuni nomi di frazioni alpine sono ambigui.
"""
import json
import sys
import time
import urllib.parse
import urllib.request

UA = "GuidaSimou/1.0 (https://github.com/buddy94/gite-simou)"

# id -> query Nominatim. Ordine irrilevante.
PLACES = {
    "simou": "Simöu, Olivone, Switzerland",
    "olivone": "Olivone, Blenio, Switzerland",
    "campo-blenio": "Campo Blenio, Switzerland",
    "ghirone": "Ghirone, Blenio, Switzerland",
    "diga-luzzone": "Lago di Luzzone, Ticino, Switzerland",
    "passo-lucomagno": "Passo del Lucomagno, Switzerland",
    "acquacalda": "Acquacalda, Olivone, Switzerland",
    "dotra": "Dötra, Blenio, Switzerland",
    "sommascona": "Sommascona, Olivone, Switzerland",
    "anveuda": "Anvéuda, Blenio, Switzerland",
    "leontica": "Leontica, Acquarossa, Switzerland",
    "nara": "Nara, Leontica, Switzerland",
    "acquarossa": "Acquarossa, Ticino, Switzerland",
    "lottigna": "Lottigna, Acquarossa, Switzerland",
    "comprovasco": "Comprovasco, Acquarossa, Switzerland",
    "corzoneso": "Corzoneso, Acquarossa, Switzerland",
    "dangio": "Dangio, Blenio, Switzerland",
    "torre": "Torre, Blenio, Switzerland",
    "malvaglia": "Malvaglia, Serravalle, Switzerland",
    "ludiano": "Ludiano, Serravalle, Switzerland",
    "semione": "Semione, Serravalle, Switzerland",
    "biasca": "Biasca, Ticino, Switzerland",
    "bellinzona": "Bellinzona, Ticino, Switzerland",
    "castelgrande": "Castelgrande, Bellinzona, Switzerland",
    "piotta": "Piotta, Quinto, Switzerland",
    "lago-ritom": "Lago Ritom, Ticino, Switzerland",
    "chironico": "Chironico, Faido, Switzerland",
    "cresciano": "Cresciano, Riviera, Switzerland",
    "faido": "Faido, Ticino, Switzerland",
    "bodio": "Bodio, Ticino, Switzerland",
    "prato-leventina": "Prato Leventina, Switzerland",
    "pontirone": "Pontirone, Biasca, Switzerland",
    "camperio": "Camperio, Blenio, Switzerland",
    "aquila": "Aquila, Blenio, Switzerland",
    "dalpe": "Dalpe, Ticino, Switzerland",
    "sobrio": "Sobrio, Faido, Switzerland",
    "osco": "Osco, Faido, Switzerland",
    "anzonico": "Anzonico, Faido, Switzerland",
    "val-malvaglia": "Val Malvaglia, Switzerland",
    "monte-dagro": "Dagro, Serravalle, Switzerland",
    "greina": "Passo della Greina, Switzerland",
    "capanna-bovarina": "Capanna Bovarina, Switzerland",
    "capanna-adula": "Capanna Adula UTOE, Switzerland",
    "capanna-motterascio": "Capanna Michela Motterascio, Switzerland",
    "capanna-scaletta": "Capanna Scaletta, Blenio, Switzerland",
    "capanna-gorda": "Capanna Gorda, Blenio, Switzerland",
    "capanna-cadagno": "Capanna Cadagno, Switzerland",
    "adula": "Rheinwaldhorn, Switzerland",
    "sosto": "Pizzo Sosto, Olivone, Switzerland",
    "tremorgio": "Lago Tremorgio, Switzerland",
    "airolo": "Airolo, Ticino, Switzerland",
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
    return {
        "lat": float(hit["lat"]),
        "lon": float(hit["lon"]),
        "display_name": hit["display_name"],
    }


def main():
    out = {}
    for pid, query in PLACES.items():
        try:
            hit = geocode(query)
        except Exception as exc:  # noqa: BLE001 - script diagnostico
            print(f"ERR {pid}: {exc}", file=sys.stderr)
            hit = None
        if hit is None:
            print(f"MISS {pid}: {query}", file=sys.stderr)
        else:
            print(f"OK   {pid}: {hit['lat']:.5f},{hit['lon']:.5f}  {hit['display_name'][:70]}",
                  file=sys.stderr)
            out[pid] = hit
        time.sleep(1.1)  # rate limit Nominatim
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
