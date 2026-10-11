"""
Cut the hero character (crouched silhouette on a pole, sword on his back) out of the
moonlit reference image.
  python scripts/cutout-itachi.py <ref.jpg> <outDir>

Writes (all the same size, aligned):
  body.png   silhouette (navy moon-rim kept), the top of his own pole fading out below
  sword.png  the visible hilt + a synthetic dark blade continuing behind his back
             (rendered behind the body: sliding it along its axis "draws" the sword)
  eyes.png   the eye glints, tinted ember, as an additive glow layer
  meta.json  geometry for src/anime/Character.ts (anchor, sword axis, wind regions) in uv
"""
import cv2, json, numpy as np, sys, os

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
img = cv2.imread(src)  # BGR
H0, W0 = img.shape[:2]

# crop (reference px)
X0, Y0, X1, Y1 = 715, 335, 1220, 1000
FEET_Y = 798            # where his feet meet the pole cap
POLE = (888, 1032)      # pole x-range below the feet
HILT_TOP = (1118, 345)  # end of the hilt
HILT_IN = (1043, 440)   # where the hilt enters the silhouette
HILT_HALF = 12          # half width of the hilt (px)
EYES = [(948, 466), (988, 466)]

crop = img[Y0:Y1, X0:X1].astype(np.float32)
h, w = crop.shape[:2]
lum = cv2.cvtColor(crop.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)

# silhouette: dark against the bright moon; soft edge from luminance for anti-aliasing
alpha = np.clip((175 - lum) / 70, 0, 1)
# restrict to the figure + his pole (the sky below the moon is dark too)
region = np.zeros((h, w), np.uint8)
fig_poly = np.array([(725, 640), (790, 575), (842, 520), (850, 420), (900, 352), (1000, 352), (1030, 372),
                     (1125, 330), (1140, 360), (1210, 470), (1215, 505), (1180, 505), (1110, 470), (1075, 520),
                     (1100, 600), (1190, 640), (1200, 760), (1120, 790), (1040, 800), (1036, 1000),
                     (884, 1000), (880, 800), (830, 785), (760, 760), (722, 700)], np.int32) - [X0, Y0]
cv2.fillPoly(region, [fig_poly], 1)
region = cv2.GaussianBlur(region.astype(np.float32), (0, 0), 1.2)
alpha *= np.clip(region * 1.2, 0, 1)

# fill enclosed bright specks inside the figure (the eyes) so the silhouette is solid
solid = (alpha > 0.5).astype(np.uint8)
ff = (1 - solid).copy()
m = np.zeros((h + 2, w + 2), np.uint8)
cv2.floodFill(ff, m, (0, 0), 2)
holes = (ff == 1).astype(np.float32)
alpha = np.maximum(alpha, holes)

# below the feet only the pole remains; it fades out toward the bottom of the crop
yy, xx = np.mgrid[0:h, 0:w]
below = yy > (FEET_Y - Y0)
in_pole = (xx >= POLE[0] - X0) & (xx <= POLE[1] - X0)
alpha = np.where(below & ~in_pole, 0, alpha)
fade_start = (FEET_Y - Y0) + 60
fade = np.clip(1 - (yy - fade_start) / (h - fade_start), 0, 1)
alpha = np.where(yy > fade_start, alpha * fade ** 1.5, alpha)

# colour: keep the source (near-black with navy rim), but force the interior dark
rgb = crop[..., ::-1].copy()  # → RGB
dark = np.array([5, 6, 10], np.float32)
rgb = np.where(holes[..., None] > 0, dark, rgb)
rgb = np.minimum(rgb, 70)  # silhouettes never read bright

# eyes: their own glow layer
eyes = np.zeros((h, w, 4), np.float32)
for (ex, ey) in EYES:
    cx, cy = ex - X0, ey - Y0
    g = np.exp(-(((xx - cx) / 7.0) ** 2 + ((yy - cy) / 3.2) ** 2))
    eyes[..., 3] = np.maximum(eyes[..., 3], g)
eyes[..., 0], eyes[..., 1], eyes[..., 2] = 255, 70, 44
eyes[..., 3] *= 255

# sword: hilt (outside the head) + a synthetic blade continuing behind his back
sword = np.zeros((h, w, 4), np.float32)
ax = np.array(HILT_TOP, np.float32) - np.array(HILT_IN, np.float32)
L = float(np.hypot(*ax))
u = ax / L
n = np.array([-u[1], u[0]])
P = np.stack([xx + X0, yy + Y0], -1).astype(np.float32) - np.array(HILT_IN, np.float32)
t = P @ u          # along the axis (0 = entry, L = top)
d = np.abs(P @ n)  # across
hilt = (t > 8) & (t < L + 2) & (d < HILT_HALF)
blade = (t > -190) & (t <= 8) & (d < HILT_HALF - 3)
edge = np.clip(HILT_HALF - d, 0, 1.5) / 1.5
sword_a = np.where(hilt, alpha * 255, 0) + np.where(blade, edge * 255, 0)
sword[..., :3] = np.where(hilt[..., None], rgb, np.array([8, 9, 14], np.float32))
sword[..., 3] = np.clip(sword_a, 0, 255)
# remove the visible hilt from the body (its base inside the head stays in the body)
alpha = np.where(hilt & (t > 14), 0, alpha)

body = np.dstack([rgb, alpha * 255])

def save(name, arr):
    cv2.imwrite(os.path.join(out, name), cv2.cvtColor(np.clip(arr, 0, 255).astype(np.uint8), cv2.COLOR_RGBA2BGRA))

save("body.png", body)
save("sword.png", sword)
save("eyes.png", eyes)

uv = lambda x, y: [round((x - X0) / w, 4), round(1 - (y - Y0) / h, 4)]
meta = {
    "w": w,
    "h": h,
    "anchor": uv((POLE[0] + POLE[1]) / 2, FEET_Y),       # feet on the pole top
    "figureTop": uv(960, 352)[1],
    "poleWidth": round((POLE[1] - POLE[0]) / w, 4),        # in uv (fraction of width)
    "hiltIn": uv(*HILT_IN),
    "hiltDir": [round(float(u[0]), 4), round(float(-u[1]), 4)],  # y-up
    "hiltLen": round(L / w, 4),
    "hair": {"x0": uv(1058, 0)[0], "y0": uv(0, 505)[1], "y1": uv(0, 395)[1]},
    "figure": {"x0": uv(725, 0)[0], "x1": uv(1200, 0)[0], "y0": uv(0, FEET_Y)[1], "y1": uv(0, 350)[1]},
}
json.dump(meta, open(os.path.join(out, "meta.json"), "w"), indent=1)
print(json.dumps(meta))
