#!/usr/bin/env python3
"""Generates the Android launcher icons and the Play Store icon from the Material Design
"clipboard-check-outline" glyph (the same one the app uses as its logo).

Run from the repo root after `npm install`:  python3 scripts/generate-icons.py   (needs Pillow)
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, "node_modules/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf")
GLYPHS = os.path.join(ROOT, "node_modules/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json")
RES = os.path.join(ROOT, "android/app/src/main/res")
BRAND = (65, 84, 254, 255)  # #4154FE
WHITE = (255, 255, 255, 255)
GLYPH = chr(json.load(open(GLYPHS))["clipboard-check-outline"])


def glyph_layer(size, scale):
    """Transparent size x size layer with the white glyph centred, `scale` of the canvas tall."""
    font = ImageFont.truetype(FONT, int(size * scale))
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    box = d.textbbox((0, 0), GLYPH, font=font)
    x = (size - (box[2] - box[0])) / 2 - box[0]
    y = (size - (box[3] - box[1])) / 2 - box[1]
    d.text((x, y), GLYPH, font=font, fill=WHITE)
    return layer


def rounded(size, radius_ratio):
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=int(size * 4 * radius_ratio), fill=255)
    return mask.resize((size, size), Image.LANCZOS)


def legacy_icon(size, round_shape):
    tile = Image.new("RGBA", (size, size), BRAND)
    tile.alpha_composite(glyph_layer(size, 0.58))
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(tile, (0, 0), rounded(size, 0.5 if round_shape else 0.22))
    return out


DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
for name, factor in DENSITIES.items():
    folder = os.path.join(RES, f"mipmap-{name}")
    os.makedirs(folder, exist_ok=True)
    legacy_icon(int(48 * factor), False).save(os.path.join(folder, "ic_launcher.png"))
    legacy_icon(int(48 * factor), True).save(os.path.join(folder, "ic_launcher_round.png"))
    # adaptive foreground: 108dp canvas, glyph kept inside the 66dp safe zone
    glyph_layer(int(108 * factor), 0.40).save(os.path.join(folder, "ic_launcher_foreground.png"))

anydpi = os.path.join(RES, "mipmap-anydpi-v26")
os.makedirs(anydpi, exist_ok=True)
adaptive = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""
for f in ("ic_launcher.xml", "ic_launcher_round.xml"):
    open(os.path.join(anydpi, f), "w").write(adaptive)

open(os.path.join(RES, "values/colors.xml"), "w").write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#4154FE</color>\n</resources>\n'
)

# Play Store listing icon: 512x512, full-bleed (Google applies the mask).
store = os.path.join(ROOT, "store")
os.makedirs(store, exist_ok=True)
play = Image.new("RGBA", (512, 512), BRAND)
play.alpha_composite(glyph_layer(512, 0.55))
play.convert("RGB").save(os.path.join(store, "play-icon-512.png"))
print("icons written")
