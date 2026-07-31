#!/usr/bin/env python3
"""Compone l'immagine di anteprima per la condivisione (Open Graph).

È quella che si vede quando si incolla il link del sito su WhatsApp,
Telegram, Facebook o iMessage. Composta a mano e non generata: il testo
deve essere leggibile e scritto giusto, e le immagini generate sbagliano
quasi sempre le lettere.

Vincoli rispettati:
  - 1200x630, il formato che tutti i servizi ritagliano bene
  - sotto i 300 KB: oltre quella soglia WhatsApp spesso rinuncia
    all'anteprima e mostra solo il link nudo
  - testo grande, perché nella lista chat si vede piccolissimo

Uso: python tools/make_share_image.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / 'assets' / 'logo-512.png'
OUT = ROOT / 'assets' / 'share.jpg'

W, H = 1200, 630
FONTS = Path('C:/Windows/Fonts')

GREEN_TOP = (26, 60, 42)
GREEN_BOT = (20, 48, 34)
TEAL = (30, 77, 95)
GOLD = (240, 215, 140)
CREAM = (246, 243, 236)


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def background():
    """Sfumatura diagonale, come l'intestazione del sito."""
    img = Image.new('RGB', (W, H))
    px = img.load()
    for y in range(H):
        for x in range(0, W, 4):          # a passi di 4: 4x più veloce, invisibile
            t = (x / W * .45) + (y / H * .55)
            r = int(GREEN_TOP[0] + (TEAL[0] - GREEN_TOP[0]) * t)
            g = int(GREEN_TOP[1] + (TEAL[1] - GREEN_TOP[1]) * t)
            b = int(GREEN_BOT[2] + (TEAL[2] - GREEN_BOT[2]) * t)
            for dx in range(4):
                if x + dx < W:
                    px[x + dx, y] = (r, g, b)
    return img


def chip(draw, x, y, text, f):
    """Etichetta arrotondata come i badge dell'intestazione.

    Il riempimento è un colore pieno già miscelato col fondo invece che un
    bianco trasparente: disegnare con alpha su questa tela dava un bianco
    quasi pieno, e il testo chiaro ci spariva dentro."""
    pad_x, pad_y = 22, 12
    w = draw.textlength(text, font=f)
    h = f.size + pad_y * 2
    draw.rounded_rectangle((x, y, x + w + pad_x * 2, y + h), radius=h // 2,
                           fill=(56, 92, 82), outline=(120, 152, 140), width=2)
    draw.text((x + pad_x, y + pad_y - 3), text, font=f, fill=CREAM)
    return x + w + pad_x * 2 + 16


def main():
    img = background().convert('RGBA')
    draw = ImageDraw.Draw(img, 'RGBA')

    # logo a sinistra
    logo = Image.open(LOGO).convert('RGBA').resize((330, 330), Image.LANCZOS)
    img.alpha_composite(logo, (78, 150))

    x = 468
    draw.text((x, 150), 'OLIVONE · VALLE DI BLENIO · TICINO',
              font=font('segoeuib.ttf', 25), fill=GOLD)
    draw.text((x, 194), 'Guida di Simöu', font=font('segoeuib.ttf', 88), fill=(255, 255, 255))
    draw.text((x, 316), 'Cosa fare quando siamo su,', font=font('segoeui.ttf', 34), fill=CREAM)
    draw.text((x, 360), 'per gambe corte e gambe lunghe.', font=font('segoeui.ttf', 34), fill=CREAM)

    f = font('segoeui.ttf', 25)
    cx = x
    for label in ('66 attività', "4 fasce d'età", 'tempi auto reali'):
        cx = chip(draw, cx, 442, label, f)

    img.convert('RGB').save(OUT, quality=86, optimize=True, progressive=True)
    kb = OUT.stat().st_size // 1024
    print(f'{OUT.name}: {W}x{H}  {kb} KB', '  ⚠️ oltre 300 KB' if kb > 300 else '  ok')


if __name__ == '__main__':
    main()
