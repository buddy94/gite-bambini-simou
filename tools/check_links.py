#!/usr/bin/env python3
"""Controlla che i link esterni della guida siano ancora vivi.

Uso:  python tools/check_links.py [--timeout 20]

Legge data/index.json, segue i file elencati e prova ogni URL in `links` e
`images`. Esce con 1 se trova qualcosa di rotto, così si può usare in un hook
o in CI.

Un 403 o 406 non è un link morto: AllTrails, myswitzerland.com e altri bloccano
i client non-browser. Quei casi finiscono in una lista separata e non fanno
fallire il controllo. Stessa cosa per i 429 di Wikimedia, che è solo un limite
di frequenza: lo script riprova con attesa crescente.
"""
import argparse
import concurrent.futures
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / 'data'
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0 Safari/537.36')

# Domini noti per bloccare i client non-browser. Rispondono 403 o 406 anche
# con User-Agent e header realistici, ma nel browser le pagine si aprono:
# non sono link da correggere.
ANTIBOT = ('alltrails.com', 'sentierilucomagno.ch', 'thecrag.com', 'myswitzerland.com')
BLOCK_CODES = (403, 406)


def load_urls():
    manifest = json.loads((DATA / 'index.json').read_text(encoding='utf-8'))
    out = []
    for src in manifest['sources']:
        doc = json.loads((DATA / src).read_text(encoding='utf-8'))
        for a in doc['activities']:
            for link in a.get('links', []):
                out.append((a['id'], link.get('label', ''), link['url']))
            for img in a.get('images', []):
                out.append((a['id'], 'immagine', img))
    return out


def probe(url, timeout, attempts=3):
    """Stato HTTP dell'URL. Su 429 aspetta e riprova: Wikimedia limita le
    richieste ravvicinate e un 429 non significa che l'immagine non esista."""
    req = urllib.request.Request(url, headers={'User-Agent': UA}, method='GET')
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return res.status
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < attempts - 1:
                time.sleep(2 ** attempt * 3)
                continue
            return exc.code
        except Exception:
            return 0    # DNS, TLS, timeout: irraggiungibile
    return 429


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--timeout', type=int, default=20)
    ap.add_argument('--workers', type=int, default=4)
    args = ap.parse_args()

    urls = load_urls()
    print(f'{len(urls)} link da controllare...\n')

    broken, blocked, limited = [], [], []
    with concurrent.futures.ThreadPoolExecutor(args.workers) as pool:
        futures = {pool.submit(probe, u, args.timeout): (aid, label, u)
                   for aid, label, u in urls}
        for fut in concurrent.futures.as_completed(futures):
            aid, label, url = futures[fut]
            status = fut.result()
            if status == 200:
                continue
            if status in BLOCK_CODES and any(d in url for d in ANTIBOT):
                blocked.append((aid, url))
            elif status == 429:
                limited.append((aid, url))
            else:
                broken.append((status, aid, label, url))

    if blocked:
        print(f'{len(blocked)} bloccati da protezione anti-bot (normale, non è un errore)')
    if limited:
        print(f'{len(limited)} con limite di frequenza anche dopo i tentativi: '
              'rilancia con --workers 2 per esserne sicuro')

    if not broken:
        print('Tutti i link raggiungibili.')
        return 0

    print(f'\n{len(broken)} link da sistemare:')
    for status, aid, label, url in sorted(broken):
        print(f'  {status or "irraggiungibile":>3}  {aid} · {label}\n       {url}')
    return 1


if __name__ == '__main__':
    sys.exit(main())
