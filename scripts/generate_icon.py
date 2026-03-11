"""
Generate MRE Site Tracker app icon — 1024x1024 source PNG
Dark blue background (#1a1a2e), white building + green checkmark
"""
from PIL import Image, ImageDraw, ImageFont
import math, os

SIZE = 1024
BG     = (26, 26, 46)       # #1a1a2e dark blue
WHITE  = (255, 255, 255)
GREEN  = (76, 175, 80)      # material green 500
ACCENT = (100, 181, 246)    # light blue accent

def rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.ellipse([x0, y0, x0 + radius*2, y0 + radius*2], fill=fill)
    draw.ellipse([x1 - radius*2, y0, x1, y0 + radius*2], fill=fill)
    draw.ellipse([x0, y1 - radius*2, x0 + radius*2, y1], fill=fill)
    draw.ellipse([x1 - radius*2, y1 - radius*2, x1, y1], fill=fill)

img  = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Background rounded rect
rounded_rect(draw, [0, 0, SIZE, SIZE], 180, BG)

# ── Building silhouette ──────────────────────────────────────
cx = SIZE // 2
# Main building body
bw, bh = 320, 380
bx = cx - bw // 2
by = 260
draw.rectangle([bx, by, bx + bw, by + bh], fill=WHITE)

# Roof / top triangle
roof_pts = [(cx, by - 80), (bx - 40, by), (bx + bw + 40, by)]
draw.polygon(roof_pts, fill=ACCENT)

# Windows — 3 cols x 4 rows
win_w, win_h = 52, 52
win_gap_x = (bw - 3 * win_w) // 4
win_gap_y = (bh - 4 * win_h) // 5
for row in range(4):
    for col in range(3):
        wx = bx + win_gap_x * (col + 1) + win_w * col
        wy = by + win_gap_y * (row + 1) + win_h * row
        draw.rectangle([wx, wy, wx + win_w, wy + win_h], fill=BG)

# Door
dw, dh = 72, 100
dx = cx - dw // 2
dy = by + bh - dh
draw.rectangle([dx, dy, dx + dw, dy + dh], fill=BG)

# Ground line
draw.rectangle([bx - 60, by + bh, bx + bw + 60, by + bh + 14], fill=ACCENT)

# ── Checkmark circle (bottom-right) ─────────────────────────
cr = 130
ccx = cx + 155
ccy = by + bh - 20
draw.ellipse([ccx - cr, ccy - cr, ccx + cr, ccy + cr], fill=GREEN)

# Checkmark stroke
ck_pts = [
    (ccx - 62, ccy),
    (ccx - 20, ccy + 48),
    (ccx + 65, ccy - 55),
]
lw = 22
for i in range(len(ck_pts) - 1):
    draw.line([ck_pts[i], ck_pts[i+1]], fill=WHITE, width=lw)

# ── "MRE" text label ─────────────────────────────────────────
try:
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 90)
except:
    font = ImageFont.load_default()

text = "MRE"
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
draw.text((cx - tw // 2, 130), text, fill=WHITE, font=font)

# ── Save ─────────────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), "icon_source_1024.png")
img.save(out_path, "PNG")
print(f"Saved: {out_path}")
