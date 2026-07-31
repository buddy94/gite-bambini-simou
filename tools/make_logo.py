#!/usr/bin/env python3
"""Ritaglia in cerchio l'illustrazione del logo e ne genera le varianti.

L'immagine sorgente arriva dal generatore di immagini con la composizione
circolare su fondo bianco: qui il bianco viene tolto e sostituito da un
canale alpha, così il logo sta bene sia sul verde dell'intestazione sia sui
fondi chiari e scuri.

Uso: python tools/make_logo.py <sorgente.png>
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / 'assets'
SIZES = {'logo-512.png': 512, 'logo-192.png': 192, 'logo-96.png': 96}


def circle_crop(img):
    """Ritaglia il quadrato centrale e applica una maschera circolare."""
    side = min(img.size)
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side)).convert('RGBA')

    # maschera a risoluzione doppia poi rimpicciolita: bordo senza scalettature
    mask = Image.new('L', (side * 2, side * 2), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, side * 2 - 1, side * 2 - 1), fill=255)
    mask = mask.resize((side, side), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.4))

    out = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit('uso: python tools/make_logo.py <sorgente.png>')

    src = Path(sys.argv[1])
    if not src.is_file():
        sys.exit(f'sorgente non trovata: {src}')

    OUT.mkdir(exist_ok=True)
    circle = circle_crop(Image.open(src))

    for name, size in SIZES.items():
        img = circle.resize((size, size), Image.LANCZOS)
        # Illustrazione piatta: 256 colori bastano e pesano un terzo. Il canale
        # alpha va tenuto a parte, quantize() lo butterebbe via.
        alpha = img.getchannel('A')
        img = img.convert('RGB').quantize(colors=255, method=Image.MEDIANCUT)
        img = img.convert('RGBA')
        img.putalpha(alpha)
        img.save(OUT / name, optimize=True)
        print(f'{name}: {size}x{size}  {(OUT / name).stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
