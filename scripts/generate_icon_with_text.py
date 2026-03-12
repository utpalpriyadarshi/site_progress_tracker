"""
Add "MRE" text label to Logo3.png and generate all Android icon sizes.
"""
from PIL import Image, ImageDraw, ImageFont
import os

BASE    = os.path.dirname(os.path.abspath(__file__))
SRC     = os.path.join(BASE, "..", "Logo3.png")
RES     = os.path.join(BASE, "..", "android", "app", "src", "main", "res")

# ── Open source logo ─────────────────────────────────────────
src = Image.open(SRC).convert("RGBA")
src = src.resize((1024, 1024), Image.LANCZOS)
W, H = src.size

draw = ImageDraw.Draw(src)

# ── Dark semi-transparent strip at bottom ───────────────────
strip_h = 180
strip = Image.new("RGBA", (W, strip_h), (10, 20, 50, 200))

# Rounded bottom mask — only round the bottom corners
mask = Image.new("L", (W, strip_h), 0)
md   = ImageDraw.Draw(mask)
r    = 120  # match logo corner radius approx
md.rectangle([0, 0, W, strip_h - r], fill=255)
md.rectangle([r, strip_h - r, W - r, strip_h], fill=255)
md.ellipse([0,      strip_h - r*2, r*2,      strip_h], fill=255)
md.ellipse([W - r*2, strip_h - r*2, W,       strip_h], fill=255)

src.paste(strip, (0, H - strip_h), mask)

# ── "MRE" text ───────────────────────────────────────────────
try:
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 130)
except Exception:
    font = ImageFont.load_default()

text = "MRE"
bbox = draw.textbbox((0, 0), text, font=font)
tw   = bbox[2] - bbox[0]
th   = bbox[3] - bbox[1]
tx   = (W - tw) // 2
ty   = H - strip_h + (strip_h - th) // 2 - 10

draw.text((tx, ty), text, fill=(255, 255, 255), font=font)

# ── Save preview ─────────────────────────────────────────────
preview_path = os.path.join(BASE, "icon_preview_1024.png")
src.save(preview_path, "PNG")
print(f"Preview saved: {preview_path}")

# ── Resize to all Android sizes ──────────────────────────────
SIZES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

for folder, size in SIZES.items():
    out_dir = os.path.join(RES, folder)
    os.makedirs(out_dir, exist_ok=True)

    resized = src.resize((size, size), Image.LANCZOS)
    resized.save(os.path.join(out_dir, "ic_launcher.png"), "PNG")

    # Round crop
    circle = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask2  = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask2).ellipse([0, 0, size, size], fill=255)
    circle.paste(resized, mask=mask2)
    circle.save(os.path.join(out_dir, "ic_launcher_round.png"), "PNG")
    print(f"{folder}: {size}x{size} done")

# 512x512 for Play Store
play = src.resize((512, 512), Image.LANCZOS)
play.save(os.path.join(BASE, "icon_512_play_store.png"), "PNG")
print("icon_512_play_store.png: 512x512 done")
print("\nAll icons generated.")
