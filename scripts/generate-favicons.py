#!/usr/bin/env python3
"""Generate MatchDesks raster favicons for Google Search and legacy browsers."""

from __future__ import annotations

from pathlib import Path
import shutil

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
APP = ROOT / "app"

RED = "#dc2626"
WHITE = "#ffffff"


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = max(2, round(size * 14 / 64))
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=RED)

    font_size = round(size * 42 / 64)
    font = _font(font_size)
    bbox = draw.textbbox((0, 0), "M", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2 - bbox[0]
    y = (size - text_h) / 2 - bbox[1] - (size * 0.02)
    draw.text((x, y), "M", font=font, fill=WHITE)
    return img


def main() -> None:
    PUBLIC.mkdir(exist_ok=True)

    icon_48 = make_icon(48)
    icon_192 = make_icon(192)
    apple = make_icon(180)

    icon_48.save(PUBLIC / "icon-48.png", format="PNG", optimize=True)
    icon_192.save(PUBLIC / "icon-192.png", format="PNG", optimize=True)
    apple.save(PUBLIC / "apple-touch-icon.png", format="PNG", optimize=True)

    ico_sizes = [make_icon(16), make_icon(32), make_icon(48)]
    ico_sizes[0].save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=ico_sizes[1:],
    )

    # Next.js also serves app/favicon.ico at /favicon.ico when present.
    (PUBLIC / "favicon.ico").replace(APP / "favicon.ico")
    shutil.copy2(APP / "favicon.ico", PUBLIC / "favicon.ico")

    print("Wrote public/icon-48.png, icon-192.png, apple-touch-icon.png, favicon.ico")
    print("Wrote app/favicon.ico")


if __name__ == "__main__":
    main()
