#!/usr/bin/env python3
"""Tempi e distanze in auto da Simöu verso ogni luogo, via OSRM pubblico.

Uso: python tools/route.py tools/_places.json > tools/_drive.json

OSRM demo server: nessuna chiave, profilo "driving". I tempi sono a traffico
libero e ignorano le chiusure stagionali dei passi (Lucomagno chiude d'inverno):
la stagionalita' va marcata a mano nel dataset.
"""
import json
import sys
import time
import urllib.request

OSRM = "https://router.project-osrm.org/route/v1/driving"
ORIGIN = (46.53803, 8.90831)  # Simöu
UA = "GuidaSimou/1.0"


def route(dst_lat, dst_lon):
    url = f"{OSRM}/{ORIGIN[1]},{ORIGIN[0]};{dst_lon},{dst_lat}?overview=false"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    if data.get("code") != "Ok" or not data.get("routes"):
        return None
    leg = data["routes"][0]
    return {
        "minutes": round(leg["duration"] / 60),
        "km": round(leg["distance"] / 1000, 1),
    }


def main():
    places = json.load(open(sys.argv[1], encoding="utf-8"))
    out = {}
    for pid, p in places.items():
        try:
            r = route(p["lat"], p["lon"])
        except Exception as exc:  # noqa: BLE001 - script diagnostico
            print(f"ERR  {pid}: {exc}", file=sys.stderr)
            r = None
        if r is None:
            print(f"MISS {pid}", file=sys.stderr)
            continue
        out[pid] = r
        print(f"{r['minutes']:>4} min  {r['km']:>6} km   {pid}", file=sys.stderr)
        time.sleep(0.35)
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
