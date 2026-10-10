"""
Cut the hero character out of a black-and-white ink reference.
  python scripts/cutout-character.py <ref.jpg> <outDir>
Writes body.png + sword.png (RGBA, 3x upscaled, crisp anti-aliased ink) and meta.json
(pivot of the sword at the fist, sizes) for NightScene. Replace the reference image and
re-run to swap the character without touching code.
"""
import cv2, json, numpy as np, sys, os

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
g = cv2.imread(src, 0)
H, W = g.shape
S = 3  # upscale

ink = (g < 170).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(ink, 8)
# the character: the largest ink mass, plus any mass that sits in the figure's column
big = int(np.argmax(st[1:, 4])) + 1
bx, by, bw, bh, _ = st[big]
core_x0, core_x1 = bx + int(bw * 0.68), bx + bw
keep = np.zeros_like(ink)
for i in range(1, n):
    x, y, w, h, a = st[i]
    if i == big or (a > 60 and x < core_x1 and x + w > core_x0 and y > by):
        keep[lab == i] = 1

# fill enclosed interiors (hair, face, shirt): everything not reachable from the border
inv = (1 - keep).astype(np.uint8)
ff = inv.copy()
mask = np.zeros((H + 2, W + 2), np.uint8)
for (sx, sy) in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
    if ff[sy, sx] == 1:
        cv2.floodFill(ff, mask, (sx, sy), 2)
solid = (ff != 2).astype(np.uint8)
# drop tiny enclosed specks of cloud that survived
solid = cv2.morphologyEx(solid, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))

# Ink clouds touch the figure, so connectivity alone can't separate them: restrict to
# hand-placed regions (reference-image px) for the figure and the blade.
FIGURE = [(546,20),(600,18),(606,60),(601,95),(628,100),(642,140),(645,200),(642,240),(648,292),(632,300),(620,330),
          (612,414),(340,414),(330,360),(338,338),(380,318),(450,290),(505,268),(520,250),(530,225),(538,180),(541,140),
          (545,100),(548,90),(540,60),(544,30)]
BLADE = [(145,262),(250,257),(360,254),(440,246),(500,236),(508,250),(505,262),(440,272),(360,284),(280,300),(200,302),(145,290)]
FIST = (515, 242)
TIP = (150, 272)
region = np.zeros_like(solid)
cv2.fillPoly(region, [np.array(FIGURE, np.int32)], 1)
blade_r = np.zeros_like(solid)
cv2.fillPoly(blade_r, [np.array(BLADE, np.int32)], 1)
region = cv2.dilate(region, np.ones((5, 5), np.uint8))
solid = solid * np.clip(region + blade_r, 0, 1)

ys, xs = np.nonzero(solid)
x0, x1, y0, y1 = xs.min() - 4, xs.max() + 4, max(0, ys.min() - 4), ys.max()
crop_g = g[y0:y1, x0:x1]
crop_m = solid[y0:y1, x0:x1].astype(np.float32)

# upscale: smooth then re-sharpen the ink into crisp anti-aliased edges
big_g = cv2.resize(crop_g, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
big_m = cv2.resize(crop_m, None, fx=S, fy=S, interpolation=cv2.INTER_LINEAR)
big_m = cv2.GaussianBlur(big_m, (0, 0), 0.8)
alpha = np.clip((big_m - 0.35) / 0.3, 0, 1)
tone = np.clip((big_g - 0.38) / 0.24, 0, 1)  # 0 = ink, 1 = paper
# fade the lower body into mist (the figure rises out of the pole-top haze)
hh = alpha.shape[0]
fade = np.clip((np.arange(hh) / hh - 0.78) / 0.22, 0, 1)[:, None]
alpha = alpha * (1 - fade ** 1.6)

ink_c = np.array([6, 6, 7], np.float32)        # near-black (RGB)
paper_c = np.array([236, 230, 216], np.float32)  # warm off-white, matches the moon
rgb = ink_c[None, None, :] * (1 - tone[..., None]) + paper_c[None, None, :] * tone[..., None]
rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)

# sword: the blade region, as its own layer pivoting at the fist
blade_big = cv2.resize(blade_r[y0:y1, x0:x1].astype(np.float32), None, fx=S, fy=S, interpolation=cv2.INTER_LINEAR) > 0.5
blade_big &= ~(cv2.resize((region[y0:y1, x0:x1]).astype(np.float32), None, fx=S, fy=S) > 0.5) | (np.arange(rgba.shape[1])[None, :] < (FIST[0] - 6 - x0) * S)
fist = (int((FIST[0] - x0) * S), int((FIST[1] - y0) * S))
sword = rgba.copy()
sword[..., 3] = np.where(blade_big, rgba[..., 3], 0)
body = rgba.copy()
body[..., 3] = np.where(blade_big, 0, rgba[..., 3])

def save(name, arr):
    cv2.imwrite(os.path.join(out, name), cv2.cvtColor(arr, cv2.COLOR_RGBA2BGRA))

save("body.png", body)
save("sword.png", sword)
meta = {"w": rgba.shape[1], "h": rgba.shape[0], "pivot": [fist[0], fist[1]]}
json.dump(meta, open(os.path.join(out, "meta.json"), "w"))
print(meta)
