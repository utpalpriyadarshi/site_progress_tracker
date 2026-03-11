"""
Resize icon_source_1024.png to all required Android launcher icon sizes
and copy to the correct mipmap directories.
"""
from PIL import Image
import os, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(BASE, "icon_source_1024.png")
RES  = os.path.join(BASE, "..", "android", "app", "src", "main", "res")

SIZES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

src_img = Image.open(SRC).convert("RGBA")

for folder, size in SIZES.items():
    out_dir = os.path.join(RES, folder)
    os.makedirs(out_dir, exist_ok=True)
    resized = src_img.resize((size, size), Image.LANCZOS)
    # Square icon
    resized.save(os.path.join(out_dir, "ic_launcher.png"), "PNG")
    # Round icon (circular crop)
    circle = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    from PIL import ImageDraw
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
    circle.paste(resized, mask=mask)
    circle.save(os.path.join(out_dir, "ic_launcher_round.png"), "PNG")
    print(f"{folder}: {size}x{size} done")

# Also save 512x512 for Play Store
play_store = src_img.resize((512, 512), Image.LANCZOS)
play_store.save(os.path.join(BASE, "icon_512_play_store.png"), "PNG")
print("icon_512_play_store.png: 512x512 done")

print("\nAll icons generated successfully.")
